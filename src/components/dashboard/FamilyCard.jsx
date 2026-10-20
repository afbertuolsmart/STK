
import React, { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { fmtQty } from '@/lib/dashboardData';
import { ColorDetail } from './ColorDetail';
import { TrendPanel } from './TrendPanel';

const COLORS = {
  primary: {
    bg: 'bg-[#eef4f7]',
    border: 'border-[#dbe7ec]',
    text: 'text-[#315d78]',
  },
  neutral: {
    bg: 'bg-[#f1f4f6]',
    text: 'text-[#526575]',
  },
  purchase: {
    bg: 'bg-[#fff8e8]',
    text: 'text-[#c77a00]',
  },
  production: {
    bg: 'bg-[#f5f0fa]',
    text: 'text-[#7654a3]',
  },
  sales: {
    bg: 'bg-[#eef8f1]',
    text: 'text-[#269653]',
  },
  consumption: {
    bg: 'bg-[#fff3ea]',
    text: 'text-[#d96b32]',
  },
};

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export function FamilyCard({
  family,
  onSelectColor,
  forceExpanded,
  selectedCorName,
  onFocus,
}) {
  const [expanded, setExpanded] = useState(false);

  const isExpanded = Boolean(forceExpanded || expanded);

  const nomeFamilia = normalizarTexto(
    family?.familia ??
    family?.nome ??
    family?.name ??
    ''
  );

  const isNapaMadrid = nomeFamilia.includes('NAPA MADRID');

  const origemColor =
    family.origem === 'Importado'
      ? 'bg-red-50 text-red-600 border-red-100'
      : family.origem === 'Misto'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-slate-50 text-slate-600 border-slate-200';

  const handleHeaderClick = () => {
    if (onFocus) {
      onFocus();
    } else {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <Card
      className="
        overflow-hidden
        rounded-2xl
        border border-slate-200/80
        bg-white
        shadow-[0_2px_8px_rgba(15,23,42,0.045)]
        transition-all duration-200
        hover:shadow-[0_5px_16px_rgba(15,23,42,0.07)]
      "
    >
      {/* CABEÇALHO DA FAMÍLIA */}
      <div
        className={`
          p-3.5 transition-colors
          ${forceExpanded ? '' : 'cursor-pointer hover:bg-slate-50/40'}
        `}
        onClick={handleHeaderClick}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className="
                flex h-6 w-6 shrink-0 items-center justify-center
                rounded-md border border-slate-100 bg-slate-50
              "
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-semibold leading-5 text-slate-800">
                {family.familia}
              </h3>

              <span className="text-[10px] text-slate-400">
                {family.cores.length} cores
              </span>
            </div>
          </div>

          {isNapaMadrid ? (
            <Badge
              variant="outline"
              className="
                ml-2 shrink-0 rounded-full
                border-slate-200 bg-slate-100
                px-2 py-0.5 text-[9px] font-semibold text-slate-700
              "
            >
              NAPA MADRID
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={`
                ml-2 shrink-0 rounded-full
                px-2 py-0.5 text-[9px] font-medium
                ${origemColor}
              `}
            >
              {family.origem}
            </Badge>
          )}
        </div>

        {/* ESTOQUE GERAL */}
        <div
          className={`
            mb-2.5 rounded-xl border
            ${COLORS.primary.border}
            ${COLORS.primary.bg}
            px-3 py-3
          `}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500">
                Estoque geral
              </p>

              <p
                className={`
                  mt-0.5 text-[21px] leading-7
                  font-semibold tracking-tight
                  ${COLORS.primary.text}
                `}
              >
                {fmtQty(family.estoqueGeral)}
              </p>
            </div>

            <span className="pt-1 text-[8px] text-slate-400">
              Estoque + compras + OP
            </span>
          </div>

          {/* INDICADORES */}
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-[9px] text-slate-400">Estoque</p>
              <p className={`mt-0.5 text-[11px] font-medium ${COLORS.neutral.text}`}>
                {fmtQty(family.estoque)}
              </p>
            </div>

            <div>
              <p className="text-[9px] text-slate-400">Compras</p>
              <p className={`mt-0.5 text-[11px] font-medium ${COLORS.purchase.text}`}>
                {fmtQty(family.compras)}
              </p>
            </div>

            <div>
              <p className="text-[9px] text-slate-400">OP</p>
              <p className={`mt-0.5 text-[11px] font-medium ${COLORS.production.text}`}>
                {fmtQty(family.op)}
              </p>
            </div>

            <div>
              <p className="text-[9px] text-slate-400">Vendas</p>
              <p className={`mt-0.5 text-[11px] font-medium ${COLORS.sales.text}`}>
                {fmtQty(family.vendas)}
              </p>
            </div>
          </div>
        </div>

        {/* SAÍDA TOTAL */}
        <div className="mb-2.5 rounded-xl border border-[#dbe7ec] bg-[#eef4f7] px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.06em] text-slate-500">
                Saída total
              </p>

              <p className="mt-0.5 text-[17px] leading-6 font-semibold text-[#315d78]">
                {fmtQty(
                  (Number(family.vendas) || 0) +
                  (Number(family.consumo) || 0)
                )}
              </p>
            </div>

            <span className="text-[8px] text-slate-400">
              Vendas + Consumo
            </span>
          </div>
        </div>

        {/* CONSUMO */}
        <div className="flex items-center justify-between rounded-xl border border-[#f2dfd2] bg-[#fff3ea] px-3 py-2.5">
          <div>
            <p className="text-[9px] text-slate-500">Consumo (12m)</p>

            <p className="mt-0.5 text-[12px] font-semibold text-[#d96b32]">
              {fmtQty(family.consumo)}
            </p>
          </div>

          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fbe4d5]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#d96b32]" />
          </div>
        </div>

        {/* ESTOQUE POR LOCAL */}
        {(family.estoqueRS > 0 || family.estoqueSC > 0) && (
          <div className="mt-2.5 flex gap-4 px-1 text-[9px] text-slate-400">
            <span>
              RS (SMT):{' '}
              <strong className="font-medium text-slate-600">
                {fmtQty(family.estoqueRS)}
              </strong>
            </span>

            <span>
              SC (SM3):{' '}
              <strong className="font-medium text-slate-600">
                {fmtQty(family.estoqueSC)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* DETALHES E CORES */}
      {isExpanded && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-3">
          <TrendPanel
            consumoByDay={family.consumoByDay}
            vendasByDay={family.vendasByDay}
          />

          <p className="px-1 text-[10px] font-medium text-slate-500">
            Clique numa cor para analisar
          </p>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {family.cores.map((cor) => (
              <ColorDetail
                key={cor.cor}
                cor={cor}
                origem={family.origem}
                showNapaMadridCategory={isNapaMadrid}
                selected={selectedCorName === cor.cor}
                onSelectColor={(corName) =>
                  onSelectColor(
                    family.familia,
                    family.origem,
                    corName
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
