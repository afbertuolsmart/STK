import React, { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import {
  fmtQty,
  buildWindowTrend,
} from '@/lib/dashboardData';

import { ConsumoVendasChart } from '@/components/dashboard/ConsumoVendasChart';

const WINDOWS = [
  {
    key: 'consumo_1m',
    label: 'Último mês',
    months: 1,
  },
  {
    key: 'consumo_3m',
    label: 'Últimos 3 meses',
    months: 3,
  },
  {
    key: 'consumo_6m',
    label: 'Últimos 6 meses',
    months: 6,
  },
  {
    key: 'consumo_12m',
    label: 'Últimos 12 meses',
    months: 12,
  },
];

const fmtCobertura = (meses) => {
  if (!Number.isFinite(meses)) {
    return '—';
  }

  return `${meses.toFixed(1)} meses`;
};

export function ColorAnalysisPanel({
  familia,
  cor,
  onBack,
}) {
  const [windowKey, setWindowKey] = useState(
    'consumo_12m'
  );

  const selectedWindow =
    WINDOWS.find(
      (w) => w.key === windowKey
    ) || WINDOWS[3];

  // CONSUMO
  const consumoValue =
    Number(cor[windowKey]) || 0;

  // VENDAS
  const vendasKey =
    windowKey.replace(
      'consumo',
      'vendas'
    );

  const vendasValue =
    Number(cor[vendasKey]) || 0;

  // SAÍDA TOTAL
  const saidaTotal =
    vendasValue + consumoValue;

  // ESTOQUE FÍSICO
  const estoqueFisico =
    Number(cor.estoque) || 0;

  // COMPRAS EM ABERTO
  const comprasAberto =
    Number(cor.compras) || 0;

  // ESTOQUE DISPONÍVEL
  const estoqueDisponivel =
    estoqueFisico + comprasAberto;

  // MÉDIA MENSAL DA SAÍDA
  const mediaMensalSaida =
    selectedWindow.months > 0
      ? saidaTotal /
        selectedWindow.months
      : 0;

  // COBERTURA EM MESES
  const cobertura =
    mediaMensalSaida > 0
      ? estoqueDisponivel /
        mediaMensalSaida
      : Infinity;

  // GRÁFICO
  const trend = buildWindowTrend(
    cor.consumoByDay,
    cor.vendasByDay,
    windowKey
  );

  const metrics = [
    {
      label: 'Estoque Geral',
      value: cor.estoqueGeral,
      color: 'text-[#315d78]',
      bg: 'bg-[#eef4f7]',
      border: 'border-[#dbe7ec]',
    },
    {
      label: 'Estoque Físico',
      value: estoqueFisico,
      color: 'text-[#526575]',
      bg: 'bg-[#f1f4f6]',
      border: 'border-[#e1e7eb]',
    },
    {
      label: 'Compras em Aberto',
      value: comprasAberto,
      color: 'text-[#c77a00]',
      bg: 'bg-[#fff8e8]',
      border: 'border-[#f2e6c4]',
    },
    {
      label: 'Ordens de Produção',
      value: cor.op,
      color: 'text-[#7654a3]',
      bg: 'bg-[#f5f0fa]',
      border: 'border-[#e9def2]',
    },
    {
      label: `Vendas (${selectedWindow.label})`,
      value: vendasValue,
      color: 'text-[#269653]',
      bg: 'bg-[#eef8f1]',
      border: 'border-[#dcefe2]',
    },
    {
      label: `Consumo (${selectedWindow.label})`,
      value: consumoValue,
      color: 'text-[#d96b32]',
      bg: 'bg-[#fff3ea]',
      border: 'border-[#f2dfd2]',
    },
  ];

  return (
    <Card
      className="
        overflow-hidden
        rounded-2xl
        border border-slate-200/80
        bg-white
        shadow-[0_2px_8px_rgba(15,23,42,0.045)]
      "
    >
      <div className="p-5">

        {/* VOLTAR */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="
            mb-2
            -ml-2
            text-slate-500
            hover:text-[#315d78]
            hover:bg-slate-50
          "
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para as famílias
        </Button>

        {/* TÍTULO */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {familia}
          </h2>

          <p className="text-sm text-slate-500">
            Cor selecionada:{' '}
            <span className="font-semibold text-slate-700">
              {cor.cor}
            </span>
          </p>
        </div>

        {/* PERÍODO */}
        <div className="mb-5">

          <p className="text-xs font-medium text-slate-500 mb-2">
            Janela de consumo
          </p>

          <div
            className="
              flex
              flex-wrap
              rounded-xl
              border border-slate-200
              bg-slate-50/60
              p-1
              gap-1
              w-fit
            "
          >
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                onClick={() =>
                  setWindowKey(w.key)
                }
                className={`
                  px-3
                  py-1.5
                  text-sm
                  rounded-lg
                  font-medium
                  transition-all
                  ${
                    windowKey === w.key
                      ? 'bg-[#315d78] text-white shadow-sm'
                      : 'text-slate-500 hover:text-[#315d78] hover:bg-white'
                  }
                `}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* INDICADORES */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">

          {metrics.map((m) => (
            <div
              key={m.label}
              className={`
                rounded-xl
                border
                ${m.border}
                ${m.bg}
                p-3
              `}
            >
              <p className="text-[11px] text-slate-500">
                {m.label}
              </p>

              <p
                className={`
                  mt-0.5
                  text-lg
                  font-bold
                  ${m.color}
                `}
              >
                {fmtQty(m.value)}
              </p>
            </div>
          ))}

        </div>

        {/* SAÍDA TOTAL + COBERTURA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">

          {/* SAÍDA TOTAL */}
          <div
            className="
              rounded-xl
              border border-[#dbe7ec]
              bg-[#eef4f7]
              p-3
            "
          >
            <p className="text-[11px] text-slate-500">
              Saída Total ({selectedWindow.label})
            </p>

            <p className="mt-0.5 text-lg font-bold text-[#315d78]">
              {fmtQty(saidaTotal)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Vendas + Consumo
            </p>
          </div>

          {/* COBERTURA */}
          <div
            className="
              rounded-xl
              border border-[#dfe3f0]
              bg-[#f1f3fa]
              p-3
            "
          >
            <p className="text-[11px] text-slate-500">
              Cobertura ({selectedWindow.label})
            </p>

            <p className="mt-0.5 text-lg font-bold text-[#5369a6]">
              {fmtCobertura(cobertura)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Estoque físico + compras ÷ média mensal de saída
            </p>
          </div>

        </div>

        {/* DETALHAMENTO */}
        <div
          className="
            flex
            flex-wrap
            gap-x-5
            gap-y-1
            mb-5
            px-1
            text-[10px]
            text-slate-400
          "
        >
          <span>
            Estoque disponível:{' '}
            <strong className="font-medium text-slate-700">
              {fmtQty(estoqueDisponivel)}
            </strong>
          </span>

          <span>
            Média mensal de saída:{' '}
            <strong className="font-medium text-[#315d78]">
              {fmtQty(mediaMensalSaida)}
            </strong>
          </span>
        </div>

        {/* TENDÊNCIA */}
        <div className="mb-2">

          <h3 className="text-sm font-semibold text-slate-800">
            Tendência de Consumo e Vendas —{' '}
            {selectedWindow.label}
          </h3>

        </div>

        {/* GRÁFICO */}
        <div
          className="
            rounded-xl
            border border-slate-200
            bg-white
            p-3
          "
        >
          <ConsumoVendasChart
            data={trend}
          />
        </div>

      </div>
    </Card>
  );
}