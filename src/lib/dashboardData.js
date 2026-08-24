import { FAMILIAS } from "./familias.js";
export async function loadAllData() {
  const base = import.meta.env.BASE_URL;
  const get = (f) => fetch(`${base}data/${f}.json`).then((r) => (r.ok ? r.json() : []));
  const [estoque, compras, consumo, vendas, ordensProducao] = await Promise.all([
    get('estoque'), get('compras'), get('consumo'), get('vendas'), get('ordens'),
  ]);
  return { estoque, compras, consumo, vendas, ordensProducao };
}

function normalizeDesc(desc) {
  return (desc || '').toUpperCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/(\d[.,]\d)\s+MM/g, '$1MM');
}

function extractFamiliaWithColecao(desc, colecao) {
  const d = cleanSpecs(normalizeDesc(desc));

  if (!colecao) {
    return d;
  }

  const c = colecao.toUpperCase().trim();

  const idx = d.indexOf(c);

  if (idx === -1) {
    return d;
  }

  return d.substring(0, idx + c.length).trim();
}

function extractCor(desc, familia) {
  const d = cleanSpecs(normalizeDesc(desc));

  if (!familia) {
    return "";
  }

  if (!d.startsWith(familia)) {
    return "";
  }

  return d.substring(familia.length).trim();
}
const MULTIWORD_COLORS = ['OFF WHITE'];

export function buildFamiliaData(estoque) {
  const descLookup = {};
  const knownFamilias = new Set();

  // Pass 1: clean family extraction from dash descriptions
  estoque.forEach(r => {
    if (!r.desc_completa) return;
    const d = normalizeDesc(r.desc_completa);
    if (descLookup[d]) return;
    if (d.includes(' - ')) {
      const familia = cleanSpecs(d.split(' - ')[0]);
      descLookup[d] = { familia, cor: d.split(' - ').slice(1).join(' - ').trim() };
      knownFamilias.add(familia);
    }
  });

  let familiaList = [...knownFamilias].sort((a, b) => b.length - a.length);

  // Pass 2: resolve non-dash descriptions via longest-prefix match against known families
  estoque.forEach(r => {
    if (!r.desc_completa) return;
    const d = normalizeDesc(r.desc_completa);
    if (descLookup[d]) return;
    const matched = familiaList.find(f => d.startsWith(f));
    if (matched) {
      descLookup[d] = { familia: matched, cor: cleanSpecs(d.substring(matched.length)) };
      return;
    }
    let familia, cor;
    let mc = null;
    for (const c of MULTIWORD_COLORS) { if (d.endsWith(' ' + c)) { mc = c; break; } }
    if (mc) {
      familia = cleanSpecs(d.slice(0, d.length - mc.length - 1));
      cor = mc;
    } else {
      familia = extractFamiliaWithColecao(r.desc_completa, r.colecao);
      cor = extractCor(r.desc_completa, familia);
    }
    descLookup[d] = { familia, cor };
    knownFamilias.add(familia);
  });

  return { descLookup, familiaList: [...knownFamilias].sort((a, b) => b.length - a.length) };
}

export function parseFamiliaCor(desc) {
  if (!desc) {
    return {
      familia: "",
      cor: "",
    };
  }

  const texto = cleanSpecs(normalizeDesc(desc));

  const familia = [...FAMILIAS]
    .sort((a, b) => b.length - a.length)
    .find((f) => texto.startsWith(f));

  if (!familia) {
    return {
      familia: texto,
      cor: "",
    };
  }

  return {
    familia,
    cor: texto.substring(familia.length).trim(),
  };
}

export function getOrigem(subgrupo) {
  return Number(subgrupo) === 40 ? 'Importado' : 'Nacional';
}

const CONSUMO_NOW = new Date();
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CONSUMO_CUTOFFS = {
  m1: new Date(CONSUMO_NOW.getFullYear(), CONSUMO_NOW.getMonth() - 1, CONSUMO_NOW.getDate()),
  m3: new Date(CONSUMO_NOW.getFullYear(), CONSUMO_NOW.getMonth() - 3, CONSUMO_NOW.getDate()),
  m6: new Date(CONSUMO_NOW.getFullYear(), CONSUMO_NOW.getMonth() - 6, CONSUMO_NOW.getDate()),
  m12: new Date(CONSUMO_NOW.getFullYear(), CONSUMO_NOW.getMonth() - 12, CONSUMO_NOW.getDate()),
};

export function consumoWindows(dt_movto) {
  if (!dt_movto) return { m1: false, m3: false, m6: false, m12: true };
  const d = new Date(dt_movto);
  if (isNaN(d.getTime())) return { m1: false, m3: false, m6: false, m12: true };
  return {
    m1: d >= CONSUMO_CUTOFFS.m1,
    m3: d >= CONSUMO_CUTOFFS.m3,
    m6: d >= CONSUMO_CUTOFFS.m6,
    m12: d >= CONSUMO_CUTOFFS.m12,
  };
}

const WINDOW_MONTHS = { consumo_1m: 1, consumo_3m: 3, consumo_6m: 6, consumo_12m: 12 };
const pad2 = n => String(n).padStart(2, '0');

export function buildWindowTrend(consumoByDay, vendasByDay, windowKey) {
  const months = WINDOW_MONTHS[windowKey] || 12;
  const cutoff = CONSUMO_CUTOFFS['m' + months];
  const granularity = months <= 1 ? 'day' : months <= 3 ? 'week' : 'month';

  function bucketKey(d) {
    if (granularity === 'day') return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (granularity === 'week') {
      const tmp = new Date(d);
      const wd = (tmp.getDay() + 6) % 7;
      tmp.setDate(tmp.getDate() - wd);
      return `${tmp.getFullYear()}-${pad2(tmp.getMonth() + 1)}-${pad2(tmp.getDate())}`;
    }
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }
  function label(k) {
    const [y, m, d] = k.split('-');
    if (granularity === 'month') return MONTH_LABELS[Number(m) - 1];
    return `${d}/${m}`;
  }

  const dayMap = {};
  Object.entries(consumoByDay || {}).forEach(([day, qty]) => {
    const d = new Date(day.slice(0, 10) + 'T00:00:00');
    if (d < cutoff) return;
    const k = bucketKey(d);
    dayMap[k] = dayMap[k] || { consumo: 0, vendas: 0 };
    dayMap[k].consumo += qty;
  });
  Object.entries(vendasByDay || {}).forEach(([day, qty]) => {
    const d = new Date(day.slice(0, 10) + 'T00:00:00');
    if (d < cutoff) return;
    const k = bucketKey(d);
    dayMap[k] = dayMap[k] || { consumo: 0, vendas: 0 };
    dayMap[k].vendas += qty;
  });

  const result = [];
  const seen = new Set();
  const cur = new Date(cutoff);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(CONSUMO_NOW);
  while (cur <= end) {
    const k = bucketKey(cur);
    if (!seen.has(k)) {
      seen.add(k);
      result.push({ label: label(k), consumo: (dayMap[k] || {}).consumo || 0, vendas: (dayMap[k] || {}).vendas || 0 });
    }
    if (granularity === 'day') cur.setDate(cur.getDate() + 1);
    else if (granularity === 'week') cur.setDate(cur.getDate() + 7);
    else cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

function cleanSpecs(str) {
  return str
    .replace(/PU\s*[\d,]*\s*MM/i, '')
    .replace(/[\d,.]+\s*MM/i, '')
    .replace(/\bPU\b/i, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fmtQty(n) {
  return (n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function fmtMoney(n) {
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const LEAD_TIME = { Importado: 90, Nacional: 15 };
const SAFETY_DAYS = 30;

export function calcCobertura(item) {
  const consumoDiario = (item.consumo_12m || 0) / 365;
  const lead = LEAD_TIME[item.origem] || LEAD_TIME.Nacional;
  const disponivel = (item.estoque || 0) + (item.compras || 0) + (item.op || 0);
  if (consumoDiario <= 0) {
    return { consumoDiario: 0, coberturaDias: Infinity, criticidade: 'ok', quandoComprar: '—', qtdSugerida: 0, lead };
  }
  const cobertura = disponivel / consumoDiario;
  let criticidade = 'ok';
  let quandoComprar = '—';
  if (cobertura < lead) {
    criticidade = 'critico';
    quandoComprar = 'Imediato';
  } else if (cobertura < lead * 1.5) {
    criticidade = 'atencao';
    quandoComprar = 'Breve';
  }
  const qtdSugerida = Math.max(0, Math.ceil(consumoDiario * (lead + SAFETY_DAYS) - disponivel));
  return { consumoDiario, coberturaDias: cobertura, criticidade, quandoComprar, qtdSugerida, lead };
}

export function aggregateData(rawData, sigFilter, origemFilter) {
  
  const families = {};

  function getFam(familia, origem) {
    if (!families[familia]) {
      families[familia] = {
        familia, origens: new Set(),
        estoque: 0, compras: 0, op: 0, vendas: 0, consumo: 0, valorEstoque: 0,
        estoqueRS: 0, estoqueSC: 0, cores: {},
        consumoByDay: {}, vendasByDay: {},
        consumo_1m: 0, consumo_3m: 0, consumo_6m: 0, consumo_12m: 0,
        vendas_1m: 0, vendas_3m: 0, vendas_6m: 0, vendas_12m: 0,
      };
    }
    families[familia].origens.add(origem);
    return families[familia];
  }

  function getCor(fam, cor) {
    if (!fam.cores[cor]) {
      fam.cores[cor] = {
        cor, estoque: 0, compras: 0, op: 0, vendas: 0, consumo: 0, valorEstoque: 0,
        estoqueRS: 0, estoqueSC: 0, itens: {},
        consumoByMonth: {}, vendasByMonth: {},
        consumoByDay: {}, vendasByDay: {},
        consumo_1m: 0, consumo_3m: 0, consumo_6m: 0, consumo_12m: 0,
        vendas_1m: 0, vendas_3m: 0, vendas_6m: 0, vendas_12m: 0,
      };
    }
    return fam.cores[cor];
  }

  function getItem(cor, produto, desc) {
    if (!cor.itens[produto]) {
      cor.itens[produto] = {
        produto, desc, origem: '', estoque: 0, compras: 0, op: 0, vendas: 0, consumo: 0,
        valorEstoque: 0, estoqueRS: 0, estoqueSC: 0,
        consumo_1m: 0, consumo_3m: 0, consumo_6m: 0, consumo_12m: 0,
        vendas_1m: 0, vendas_3m: 0, vendas_6m: 0, vendas_12m: 0,
      };
    }
    return cor.itens[produto];
  }

  rawData.estoque.forEach(r => {
    const { familia, cor } = parseFamiliaCor(r.desc_completa);
    const origem = getOrigem(r.subgrupo);
    if (origemFilter && origem !== origemFilter) return;
    if (sigFilter && r.sig_emp !== sigFilter) return;
    const fam = getFam(familia, origem);
    const c = getCor(fam, cor);
    const qty = r.qtd_fisica || 0;
    fam.estoque += qty; c.estoque += qty;
    fam.valorEstoque += r.vlr_tot_est || 0; c.valorEstoque += r.vlr_tot_est || 0;
    if (r.sig_emp === 'SMT') { fam.estoqueRS += qty; c.estoqueRS += qty; }
    if (r.sig_emp === 'SM3') { fam.estoqueSC += qty; c.estoqueSC += qty; }
    const item = getItem(c, r.produto, r.desc_completa);
    item.origem = item.origem || origem;
    item.estoque += qty; item.valorEstoque += r.vlr_tot_est || 0;
    if (r.sig_emp === 'SMT') item.estoqueRS += qty;
    if (r.sig_emp === 'SM3') item.estoqueSC += qty;
  });

  rawData.compras.forEach(r => {
    const { familia, cor } = parseFamiliaCor(r.desc_completa);
    const origem = getOrigem(r.subgrupo);
    if (origemFilter && origem !== origemFilter) return;
    const fam = getFam(familia, origem);
    const c = getCor(fam, cor);
    const qty = r.qtd_aberto || 0;
    fam.compras += qty; c.compras += qty;
    getItem(c, r.produto, r.desc_completa).compras += qty;
  });

  rawData.consumo.forEach(r => {
    const { familia, cor } = parseFamiliaCor(r.desc_completa);
    const origem = getOrigem(r.subgrupo);
    if (origemFilter && origem !== origemFilter) return;
    const fam = getFam(familia, origem);
    const c = getCor(fam, cor);
    const qty = r.qtd_movimentada || 0;
    fam.consumo += qty; c.consumo += qty;
    const item = getItem(c, r.cod_prod, r.desc_completa);
    item.consumo += qty;
    const cm = (r.dt_movto || '').slice(0, 7);
    if (cm) c.consumoByMonth[cm] = (c.consumoByMonth[cm] || 0) + qty;
    const cd = (r.dt_movto || '').slice(0, 10);
    if (cd) { c.consumoByDay[cd] = (c.consumoByDay[cd] || 0) + qty; fam.consumoByDay[cd] = (fam.consumoByDay[cd] || 0) + qty; }
    const w = consumoWindows(r.dt_movto);
    if (w.m1) { fam.consumo_1m += qty; c.consumo_1m += qty; item.consumo_1m += qty; }
    if (w.m3) { fam.consumo_3m += qty; c.consumo_3m += qty; item.consumo_3m += qty; }
    if (w.m6) { fam.consumo_6m += qty; c.consumo_6m += qty; item.consumo_6m += qty; }
    if (w.m12) { fam.consumo_12m += qty; c.consumo_12m += qty; item.consumo_12m += qty; }
  });

  rawData.ordensProducao.forEach(r => {
    const { familia, cor } = parseFamiliaCor(r.desc_completa);
    const origem = getOrigem(r.subgrupo);
    if (origemFilter && origem !== origemFilter) return;
    const fam = getFam(familia, origem);
    const c = getCor(fam, cor);
    const qty = r.qtd_produzir || 0;
    fam.op += qty; c.op += qty;
    getItem(c, r.produto, r.desc_completa).op += qty;
  });

  rawData.vendas.forEach(r => {
    const { familia, cor } = parseFamiliaCor(r.desc_completa);
    const origem = getOrigem(r.subgrupo);
    if (origemFilter && origem !== origemFilter) return;
    if (sigFilter && r.sig_emp !== sigFilter) return;
    const fam = getFam(familia, origem);
    const c = getCor(fam, cor);
    const qty = r.qtd_faturada || 0;
    fam.vendas += qty; c.vendas += qty;
    const item = getItem(c, r.produto, r.desc_completa);
    item.vendas += qty;
    const vm = (r.dt_faturam || '').slice(0, 7);
    if (vm) c.vendasByMonth[vm] = (c.vendasByMonth[vm] || 0) + qty;
    const vd = (r.dt_faturam || '').slice(0, 10);
    if (vd) { c.vendasByDay[vd] = (c.vendasByDay[vd] || 0) + qty; fam.vendasByDay[vd] = (fam.vendasByDay[vd] || 0) + qty; }
    const w = consumoWindows(r.dt_faturam);
    if (w.m1) { fam.vendas_1m += qty; c.vendas_1m += qty; item.vendas_1m += qty; }
    if (w.m3) { fam.vendas_3m += qty; c.vendas_3m += qty; item.vendas_3m += qty; }
    if (w.m6) { fam.vendas_6m += qty; c.vendas_6m += qty; item.vendas_6m += qty; }
    if (w.m12) { fam.vendas_12m += qty; c.vendas_12m += qty; item.vendas_12m += qty; }
  });

  return Object.values(families).map(fam => {
    fam.origem = fam.origens.size === 1 ? [...fam.origens][0] : 'Misto';
    fam.estoqueGeral = fam.estoque + fam.compras + fam.op;
    fam.cores = Object.values(fam.cores).map(cor => {
      cor.estoqueGeral = cor.estoque + cor.compras + cor.op;
      cor.itens = Object.values(cor.itens).filter(i =>
        i.estoque || i.compras || i.op || i.vendas || i.consumo
      ).sort((a, b) => (b.estoque + b.compras + b.op) - (a.estoque + a.compras + a.op));
      return cor;
    }).sort((a, b) => b.estoqueGeral - a.estoqueGeral);
    return fam;
  }).sort((a, b) => b.estoqueGeral - a.estoqueGeral);
}

export function getSummary(rawData, sigFilter, origemFilter) {
  let estoque = 0, compras = 0, op = 0, vendas = 0, consumo = 0, valorEstoque = 0;
  rawData.estoque.forEach(r => {
    if (origemFilter && getOrigem(r.subgrupo) !== origemFilter) return;
    if (sigFilter && r.sig_emp !== sigFilter) return;
    estoque += r.qtd_fisica || 0;
    valorEstoque += r.vlr_tot_est || 0;
  });
  rawData.compras.forEach(r => {
    if (origemFilter && getOrigem(r.subgrupo) !== origemFilter) return;
    compras += r.qtd_aberto || 0;
  });
  rawData.consumo.forEach(r => {
    if (origemFilter && getOrigem(r.subgrupo) !== origemFilter) return;
    consumo += r.qtd_movimentada || 0;
  });
  rawData.ordensProducao.forEach(r => {
    if (origemFilter && getOrigem(r.subgrupo) !== origemFilter) return;
    op += r.qtd_produzir || 0;
  });
  rawData.vendas.forEach(r => {
    if (origemFilter && getOrigem(r.subgrupo) !== origemFilter) return;
    if (sigFilter && r.sig_emp !== sigFilter) return;
    vendas += r.qtd_faturada || 0;
  });
  return { estoque, compras, op, vendas, consumo, valorEstoque, estoqueGeral: estoque + compras + op };
}