import React from 'react';
import { ChevronRight } from 'lucide-react';
import { fmtQty } from '@/lib/dashboardData';

export function ColorDetail({ cor, selected, onSelectColor }) {
  return (
    <div
      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white hover:bg-slate-50'
      }`}
      onClick={() => onSelectColor(cor.cor)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ChevronRight className={`h-3 w-3 ${selected ? 'text-blue-500' : 'text-muted-foreground'}`} />
          <span className="font-medium text-sm">{cor.cor}</span>
        </div>
        <span className="text-sm font-bold text-blue-600">{fmtQty(cor.estoqueGeral)}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground ml-4">
        <span>Est: {fmtQty(cor.estoque)}</span>
        <span>Comp: {fmtQty(cor.compras)}</span>
        <span>OP: {fmtQty(cor.op)}</span>
        <span>Vend: {fmtQty(cor.vendas)}</span>
        <span>Cons: {fmtQty(cor.consumo)}</span>
      </div>
    </div>
  );
}