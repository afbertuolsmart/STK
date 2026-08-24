import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { fmtQty, buildWindowTrend } from '@/lib/dashboardData';
import { ConsumoVendasChart } from '@/components/dashboard/ConsumoVendasChart';

const WINDOWS = [
  { key: 'consumo_1m', label: 'Último mês' },
  { key: 'consumo_3m', label: 'Últimos 3 meses' },
  { key: 'consumo_6m', label: 'Últimos 6 meses' },
  { key: 'consumo_12m', label: 'Últimos 12 meses' },
];

export function ColorAnalysisPanel({ familia, cor, onBack }) {
  const [windowKey, setWindowKey] = useState('consumo_12m');
  const consumoValue = cor[windowKey] || 0;
  const vendasKey = windowKey.replace('consumo', 'vendas');
  const windowLabel = WINDOWS.find(w => w.key === windowKey)?.label || '';
  const trend = buildWindowTrend(cor.consumoByDay, cor.vendasByDay, windowKey);

  const metrics = [
    { label: 'Estoque Geral', value: cor.estoqueGeral, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Estoque Físico', value: cor.estoque, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Compras em Aberto', value: cor.compras, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Ordens de Produção', value: cor.op, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: `Vendas (${windowLabel})`, value: cor[vendasKey] || 0, color: 'text-green-600', bg: 'bg-green-50' },
    { label: `Consumo (${windowLabel})`, value: consumoValue, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <Card className="p-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar para as famílias
      </Button>
      <div className="mb-4">
        <h2 className="text-xl font-bold">{familia}</h2>
        <p className="text-sm text-muted-foreground">
          Cor selecionada: <span className="font-semibold text-foreground">{cor.cor}</span>
        </p>
      </div>

      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-2">Janela de consumo</p>
        <div className="flex flex-wrap rounded-lg border bg-card p-1 gap-1 w-fit">
          {WINDOWS.map(w => (
            <button
              key={w.key}
              onClick={() => setWindowKey(w.key)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                windowKey === w.key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {metrics.map(m => (
          <div key={m.label} className={`rounded-lg p-3 ${m.bg}`}>
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>{fmtQty(m.value)}</p>
          </div>
        ))}
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold">Tendência de Consumo e Vendas — {windowLabel}</h3>
      </div>
      <div className="border rounded-lg p-3">
        <ConsumoVendasChart data={trend} />
      </div>
    </Card>
  );
}