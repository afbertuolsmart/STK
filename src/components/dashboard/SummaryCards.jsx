import React from 'react';
import { Card } from '@/components/ui/card';
import { fmtQty, fmtMoney } from '@/lib/dashboardData';
import { Package, ShoppingCart, Factory, Boxes, TrendingUp, Activity } from 'lucide-react';

export function SummaryCards({ summary }) {
  const cards = [
    { label: 'Estoque Geral', value: summary.estoqueGeral, icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Estoque + Compras + OP' },
    { label: 'Estoque Físico', value: summary.estoque, icon: Package, color: 'text-slate-600', bg: 'bg-slate-100', sub: fmtMoney(summary.valorEstoque) },
    { label: 'Compras em Aberto', value: summary.compras, icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Qtd. aberto' },
    { label: 'Ordens de Produção', value: summary.op, icon: Factory, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Itens de OP' },
    { label: 'Vendas (12 meses)', value: summary.vendas, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', sub: 'Qtd. faturada' },
    { label: 'Consumo (12 meses)', value: summary.consumo, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50', sub: 'Qtd. movimentada' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <Card key={c.label} className="p-4">
          <div className={`inline-flex p-2 rounded-lg ${c.bg} mb-2`}>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="text-xl font-bold">{fmtQty(c.value)}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}