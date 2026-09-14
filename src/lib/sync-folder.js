/* global process */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const DATASETS = ['estoque', 'compras', 'consumo', 'vendas', 'ordens'];
const EXTS = ['.xlsx', '.xls', '.xlsm', '.csv'];

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const DATA_SOURCE = path.resolve(
  process.env.DATA_FOLDER || path.join(ROOT_DIR, 'data-source')
);

const OUT_DIR = path.join(ROOT_DIR, 'public', 'data');

const NUMERIC_FIELDS = new Set([
  'produto',
  'subgrupo',
  'grupo',
  'qtd_fisica',
  'qtd_aberto',
  'qtde',
  'vlr_un',
  'vlr_tot_est',
  'nro_op',
  'qtd_produzir',
  'num_oc',
  'forn',
  'cod_prod',
  'orig_movto',
  'qtd_movimentada',
  'pedido',
  'cfop',
  'cliente',
  'qtd_faturada',
  'qtd_item',
  'nota',
  'vlr_liq_item',
  'representante',
  'vlr_comissao_rep',
]);

const FIELD_MAP = {
  'Produto': 'produto',
  'Desc.completa': 'desc_completa',
  'Qtd.física': 'qtd_fisica',
  'Qtd.fisica': 'qtd_fisica',
  'Vlr.tot.est': 'vlr_tot_est',
  'Grupo': 'grupo',
  'Subgrupo': 'subgrupo',
  'Sig.emp': 'sig_emp',
  'Coleção': 'colecao',
  'Colecao': 'colecao',
  'Qtd.aberto': 'qtd_aberto',
  'Qtd.movimentada': 'qtd_movimentada',
  'Qtd.faturada': 'qtd_faturada',
  'Qtd.produzir': 'qtd_produzir',
  'Dt.movto': 'dt_movto',
  'Dt.faturam': 'dt_faturam',
  'Cod.prod': 'cod_prod',
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function dateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function normalizeValue(field, value) {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return dateStr(value);
  }

  if (NUMERIC_FIELDS.has(field)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  return String(value).trim();
}

function convertFile(file) {
  console.log(`   Lendo: ${path.basename(file)}`);

  const workbook = XLSX.readFile(file, {
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Nenhuma planilha encontrada no arquivo.');
  }

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    raw: true,
    defval: null,
  });

  return rows.map((row) => {
    const output = {};

    for (const [key, value] of Object.entries(row)) {
      const original = String(key).trim();

      const normalizedKey =
        FIELD_MAP[original] ||
        original
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/\s+/g, '_');

      output[normalizedKey] = normalizeValue(
        normalizedKey,
        value
      );
    }

    return output;
  });
}

function findDatasetFile(dataset) {
  const target = dataset.toLowerCase();

  const files = fs.readdirSync(DATA_SOURCE);

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const basename = path
      .basename(file, path.extname(file))
      .toLowerCase();

    if (
      basename === target &&
      EXTS.includes(extension)
    ) {
      return file;
    }
  }

  return null;
}

export function convertAll() {
  console.log('');
  console.log('========================================');
  console.log('       SMART STOCK - DATA SYNC');
  console.log('========================================');
  console.log('');
  console.log(`Origem : ${DATA_SOURCE}`);
  console.log(`Destino: ${OUT_DIR}`);
  console.log('');

  fs.mkdirSync(OUT_DIR, {
    recursive: true,
  });

  if (!fs.existsSync(DATA_SOURCE)) {
    console.error(
      `ERRO: pasta de origem não encontrada: ${DATA_SOURCE}`
    );

    return false;
  }

  const counts = {};
  let success = 0;

  for (const dataset of DATASETS) {
    const filename = findDatasetFile(dataset);

    if (!filename) {
      console.error(
        `✗ ${dataset}: arquivo não encontrado`
      );
      continue;
    }

    try {
      const sourceFile = path.join(
        DATA_SOURCE,
        filename
      );

      const rows = convertFile(sourceFile);

      const outputFile = path.join(
        OUT_DIR,
        `${dataset}.json`
      );

      fs.writeFileSync(
        outputFile,
        JSON.stringify(rows),
        'utf8'
      );

      counts[dataset] = rows.length;
      success++;

      console.log(
        `✓ ${dataset}.json: ${rows.length} registros`
      );
    } catch (error) {
      console.error(
        `✗ ${dataset}: ${error.message}`
      );
    }
  }

  const version = {
    updatedAt: new Date().toISOString(),
    updatedAtLocal: new Date().toLocaleString('pt-BR'),
    counts,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, '_version.json'),
    JSON.stringify(version, null, 2),
    'utf8'
  );

  console.log('');
  console.log('----------------------------------------');
  console.log(
    `Datasets atualizados: ${success}/${DATASETS.length}`
  );
  console.log(
    `Atualização: ${new Date().toLocaleString('pt-BR')}`
  );
  console.log('----------------------------------------');
  console.log('');

  return success === DATASETS.length;
}

const args = process.argv.slice(2);
const once = args.includes('--once');

if (once) {
  const success = convertAll();

  process.exit(success ? 0 : 1);
}

convertAll();

console.log(
  `Observando alterações em: ${DATA_SOURCE}`
);
console.log('Pressione Ctrl+C para parar.');
console.log('');

let timer = null;

fs.watch(
  DATA_SOURCE,
  (_event, filename) => {
    if (!filename) {
      return;
    }

    const filenameString = filename.toString();

    if (
      filenameString.startsWith('~$') ||
      !/\.(xlsx|xls|xlsm|csv)$/i.test(filenameString)
    ) {
      return;
    }

    console.log(
      `Alteração detectada: ${filenameString}`
    );

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      convertAll();
      timer = null;
    }, 1000);
  }
);