
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

  // ESTOQUE POR LOCALIZAÇÃO
  const estoqueRS =
    Number(cor.estoqueRS) || 0;

  const estoqueSC =
    Number(cor.estoqueSC) || 0;

  const estoqueEADI =
    Number(cor.estoqueEADI) || 0;

  // ESTOQUE FÍSICO LOCAL: RS + SC
  const estoqueFisico =
    estoqueRS + estoqueSC;

  // ESTOQUE FÍSICO TOTAL: RS + SC + EADI
  const estoqueFisicoTotal =
    estoqueFisico + estoqueEADI;

  // COMPRAS EM ABERTO
  const comprasAberto =
    Number(cor.compras) || 0;

  // ORDENS DE PRODUÇÃO
  const ordensProducao =
    Number(cor.op) || 0;

  // ESTOQUE DISPONÍVEL
  const estoqueDisponivel =
    estoqueFisicoTotal + comprasAberto;

  // MÉDIA MENSAL DA SAÍDA
  const mediaMensalSaida =
    selectedWindow.months > 0
      ? saidaTotal / selectedWindow.months
      : 0;

  // COBERTURA EM MESES
  const cobertura =
    mediaMensalSaida > 0
      ? estoqueDisponivel / mediaMensalSaida
      : Infinity;

  // GRÁFICO
  const trend = buildWindowTrend(
    cor.consumoByDay,
    cor.vendasByDay,
    windowKey
  );

  // INDICADORES
  const metrics = [
    {
      label: 'Estoque Geral',
      value: cor.estoqueGeral,
      color: 'text-[#75b8ff]',
      bg: 'bg-[#203b5c]',
      border: 'border-[#416487]',
    },
    {
      label: 'Estoque Físico (RS + SC)',
      value: estoqueFisico,
      color: 'text-[#d2e5f7]',
      bg: 'bg-[#203b5c]',
      border: 'border-[#416487]',
    },
    {
      label: 'Estoque EADI',
      value: estoqueEADI,
      color: 'text-[#75b8ff]',
      bg: 'bg-[#203b5c]',
      border: 'border-[#416487]',
      labelColor: 'text-[#c5d8ec]',
    },
    {
      label: 'Compras em Aberto',
      value: comprasAberto,
      color: 'text-[#ffb52e]',
      bg: 'bg-[#40351f]',
      border: 'border-[#70572c]',
    },
    {
      label: 'Ordens de Produção',
      value: ordensProducao,
      color: 'text-[#c39bff]',
      bg: 'bg-[#382e50]',
      border: 'border-[#574573]',
    },
    {
      label: `Vendas (${selectedWindow.label})`,
      value: vendasValue,
      color: 'text-[#38d98b]',
      bg: 'bg-[#193f3b]',
      border: 'border-[#28695c]',
    },
    {
      label: `Consumo (${selectedWindow.label})`,
      value: consumoValue,
      color: 'text-[#ff985b]',
      bg: 'bg-[#493326]',
      border: 'border-[#795239]',
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
              <p
                className={`
                  text-[11px]
                  ${m.labelColor || 'text-slate-300'}
                `}
              >
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
              border border-[#416487]
              bg-[#203b5c]
              p-3
            "
          >
            <p className="text-[11px] text-slate-300">
              Saída Total ({selectedWindow.label})
            </p>

            <p className="mt-0.5 text-lg font-bold text-[#75b8ff]">
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
              border border-[#416487]
              bg-[#203b5c]
              p-3
            "
          >
            <p className="text-[11px] text-slate-300">
              Cobertura ({selectedWindow.label})
            </p>

            <p className="mt-0.5 text-lg font-bold text-[#75b8ff]">
              {fmtCobertura(cobertura)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              RS + SC + EADI + compras ÷ média mensal de saída
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
            Estoque RS:{' '}
            <strong className="font-medium text-slate-600">
              {fmtQty(estoqueRS)}
            </strong>
          </span>

          <span>
            Estoque SC:{' '}
            <strong className="font-medium text-slate-600">
              {fmtQty(estoqueSC)}
            </strong>
          </span>

          <span>
            Estoque EADI:{' '}
            <strong className="font-medium text-[#315d78]">
              {fmtQty(estoqueEADI)}
            </strong>
          </span>

          <span>
            Estoque disponível:{' '}
            <strong className="font-medium text-slate-600">
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
