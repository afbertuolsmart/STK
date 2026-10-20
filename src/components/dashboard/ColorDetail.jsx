
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { fmtQty } from '@/lib/dashboardData';

const CORES_BASICAS = new Set([
  'OFF WHITE',
  'BEGE',
  'CARAMELO',
  'CANELA',
  'CAFE',
  'PRETO',
]);

const CORES_COLORIDAS = new Set([
  'BRANCO',
  'MANTEIGA',
  'NUDE',
  'CASTOR',
  'ROSE',
  'MENTA',
  'LAGOA AZUL',
  'BLUSH',
  'MOCHA MOUSSE',
  'MEL',
  'CONHAQUE',
  'MILITAR',
  'BORDO',
]);

function normalizarCor(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*[-–—]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function getCategoriaNapaMadrid(cor) {
  const nome = normalizarCor(cor);

  if (CORES_BASICAS.has(nome)) {
    return 'BASICAS';
  }

  if (CORES_COLORIDAS.has(nome)) {
    return 'COLORIDAS';
  }

  return null;
}

export function ColorDetail({
  cor,
  selected,
  onSelectColor,
  showNapaMadridCategory = false,
}) {
  const categoria = showNapaMadridCategory
    ? getCategoriaNapaMadrid(cor.cor)
    : null;

  return (
    <div
      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
        selected
          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
          : 'bg-white hover:bg-slate-50'
      }`}
      onClick={() => onSelectColor(cor.cor)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <ChevronRight
            className={`h-3 w-3 shrink-0 ${
              selected
                ? 'text-blue-500'
                : 'text-muted-foreground'
            }`}
          />

          <span className="font-medium text-sm">
            {cor.cor}
          </span>

          {showNapaMadridCategory && categoria && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-semibold tracking-wide ${
                categoria === 'BASICAS'
                  ? 'border-slate-200 bg-slate-100 text-slate-700'
                  : 'border-violet-200 bg-violet-50 text-violet-700'
              }`}
            >
              {categoria}
            </span>
          )}
        </div>

        <span className="shrink-0 text-sm font-bold text-blue-600">
          {fmtQty(cor.estoqueGeral)}
        </span>
      </div>

      <div className="ml-4 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Est: {fmtQty(cor.estoque)}</span>
        <span>Comp: {fmtQty(cor.compras)}</span>
        <span>OP: {fmtQty(cor.op)}</span>
        <span>Vend: {fmtQty(cor.vendas)}</span>
        <span>Cons: {fmtQty(cor.consumo)}</span>
      </div>
    </div>
  );
}
