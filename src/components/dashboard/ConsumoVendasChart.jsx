import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtQty } from '@/lib/dashboardData';

export function ConsumoVendasChart({ data }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip formatter={(v) => fmtQty(v)} contentStyle={{ fontSize: 12 }} />
          <Legend />
          <Line type="monotone" dataKey="consumo" name="Consumo" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="vendas" name="Vendas" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}