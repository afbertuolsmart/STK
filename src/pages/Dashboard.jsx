import React, { useState, useEffect, useMemo } from 'react';
import { loadAllData, aggregateData, getSummary } from '@/lib/dashboardData';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FamilyCard } from '@/components/dashboard/FamilyCard';
import { ColorAnalysisPanel } from '@/components/dashboard/ColorAnalysisPanel';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sigFilter, setSigFilter] = useState('');
  const [origemFilter, setOrigemFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [focusedFamily, setFocusedFamily] = useState(null);

  useEffect(() => {
    loadAllData()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setError(e); setLoading(false); });
  }, []);

  // Auto-refresh when the local sync script regenerates the JSON files.
  useEffect(() => {
    let last = null;
    let active = true;
    const base = import.meta.env.BASE_URL;
    const check = async () => {
      try {
        const res = await fetch(`${base}data/_version.json`, { cache: 'no-store' });
        if (!res.ok) return;
        const v = await res.json();
        if (!active || v.updatedAt === last) return;
        if (last !== null) {
          const d = await loadAllData();
          if (active) setData(d);
        }
        last = v.updatedAt;
      } catch { /* no version file yet */ }
    };
    check();
    const id = setInterval(check, 10000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const families = useMemo(() => {
    if (!data) return [];
    return aggregateData(data, sigFilter, origemFilter);
  }, [data, sigFilter, origemFilter]);

  const summary = useMemo(() => {
    if (!data) return null;
    return getSummary(data, sigFilter, origemFilter);
  }, [data, sigFilter, origemFilter]);

  const filtered = useMemo(() => {
    if (!search) return families;
    const s = search.toLowerCase();
    return families.filter(f => f.familia.toLowerCase().includes(s));
  }, [families, search]);

  const handleSelectColor = (familia, origem, cor) => {
    setSelectedColor({ familia, origem, cor });
  };

  const selectedFam = selectedColor
    ? families.find(f => f.familia === selectedColor.familia && f.origem === selectedColor.origem)
    : null;
  const selectedCor = selectedFam
    ? selectedFam.cores.find(c => c.cor === selectedColor.cor)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-destructive">Erro ao carregar dados. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard de Compras, Estoque e Consumo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise consolidada por família e cor de produto — Base: 23/07/2026
          </p>
        </div>

        <FilterBar
          sigFilter={sigFilter}
          setSigFilter={setSigFilter}
          origemFilter={origemFilter}
          setOrigemFilter={setOrigemFilter}
          search={search}
          setSearch={setSearch}
        />

        {summary && (
          <div className="mb-6">
            <SummaryCards summary={summary} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Famílias de Produtos</h2>
          <span className="text-sm text-muted-foreground">{filtered.length} famílias</span>
        </div>

        {selectedColor && selectedFam && selectedCor ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <FamilyCard
                family={selectedFam}
                forceExpanded
                selectedCorName={selectedColor.cor}
                onSelectColor={(fam, orig, corName) => setSelectedColor({ familia: fam, origem: orig, cor: corName })}
              />
            </div>
            <div className="lg:col-span-2">
              <ColorAnalysisPanel
                familia={selectedFam.familia}
                cor={selectedCor}
                onBack={() => setSelectedColor(null)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{filtered
  .filter(fam => !focusedFamily || focusedFamily === `${fam.familia}-${fam.origem}`)
  .map(fam => (
    <FamilyCard
      key={`${fam.familia}-${fam.origem}`}
      family={fam}
      onSelectColor={handleSelectColor}
      forceExpanded={focusedFamily === `${fam.familia}-${fam.origem}`}
      onFocus={() =>
        setFocusedFamily(prev =>
          prev === `${fam.familia}-${fam.origem}`
            ? null
            : `${fam.familia}-${fam.origem}`
        )
      }
    />
))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma família encontrada com os filtros selecionados.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}