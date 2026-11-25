
import React, { useState, useEffect, useMemo } from 'react';
import { loadAllData, aggregateData, getSummary } from '@/lib/dashboardData';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FamilyCard } from '@/components/dashboard/FamilyCard';
import { ColorAnalysisPanel } from '@/components/dashboard/ColorAnalysisPanel';
import { Loader2, Sun, Moon } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sigFilter, setSigFilter] = useState('');
  const [origemFilter, setOrigemFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [focusedFamily, setFocusedFamily] = useState(null);

  // Tema visual salvo no navegador
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('stk-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('stk-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Carregamento dos dados
  useEffect(() => {
    loadAllData()
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setError(e);
        setLoading(false);
      });
  }, []);

  // Atualização automática dos dados
  useEffect(() => {
    let last = null;
    let active = true;
    const base = import.meta.env.BASE_URL;

    const check = async () => {
      try {
        const res = await fetch(`${base}data/_version.json`, {
          cache: 'no-store'
        });

        if (!res.ok) return;

        const v = await res.json();

        if (!active || v.updatedAt === last) return;

        if (last !== null) {
          const d = await loadAllData();
          if (active) setData(d);
        }

        last = v.updatedAt;
      } catch {
        // Arquivo de versão ainda não disponível
      }
    };

    check();

    const id = setInterval(check, 10000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Famílias filtradas
  const families = useMemo(() => {
    if (!data) return [];
    return aggregateData(data, sigFilter, origemFilter);
  }, [data, sigFilter, origemFilter]);

  // Indicadores gerais
  const summary = useMemo(() => {
    if (!data) return null;
    return getSummary(data, sigFilter, origemFilter);
  }, [data, sigFilter, origemFilter]);

  // Pesquisa de famílias
  const filtered = useMemo(() => {
    if (!search) return families;

    const s = search.toLowerCase();

    return families.filter(f =>
      f.familia.toLowerCase().includes(s)
    );
  }, [families, search]);

  // Seleção de cor
  const handleSelectColor = (familia, origem, cor) => {
    setSelectedColor({ familia, origem, cor });
  };

  const selectedFam = selectedColor
    ? families.find(
        f =>
          f.familia === selectedColor.familia &&
          f.origem === selectedColor.origem
      )
    : null;

  const selectedCor = selectedFam
    ? selectedFam.cores.find(
        c => c.cor === selectedColor.cor
      )
    : null;

  // Carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#101E35]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-muted-foreground">
            Carregando dados...
          </p>
        </div>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#101E35]">
        <p className="text-sm text-destructive">
          Erro ao carregar dados. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101E35] text-slate-900 dark:text-slate-100 p-4 md:p-6 transition-colors duration-300">

      <div className="max-w-7xl mx-auto">

        {/* CABEÇALHO */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">

          <div>
            <h1 className="text-2xl font-bold">
              Dashboard de Compras, Estoque e Consumo
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Análise consolidada por família e cor de produto — Base: 23/07/2026
            </p>
          </div>

          {/* ALTERNÂNCIA DE TEMA */}
          <button
            type="button"
            onClick={() => setDarkMode(prev => !prev)}
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-[#405A79] bg-white dark:bg-[#172B49] px-4 py-2 text-slate-700 dark:text-slate-100 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-[#203858]"
          >
            {darkMode ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            <span className="text-sm font-medium">
              {darkMode ? 'Modo claro' : 'Modo escuro'}
            </span>
          </button>

        </div>

        {/* FILTROS */}
        <FilterBar
          sigFilter={sigFilter}
          setSigFilter={setSigFilter}
          origemFilter={origemFilter}
          setOrigemFilter={setOrigemFilter}
          search={search}
          setSearch={setSearch}
        />

        {/* INDICADORES GERAIS */}
        {summary && (
          <div className="mb-6">
            <SummaryCards summary={summary} />
          </div>
        )}

        {/* FAMÍLIAS */}
        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-lg font-semibold">
            Famílias de Produtos
          </h2>

          <span className="text-sm text-muted-foreground">
            {filtered.length} famílias
          </span>

        </div>

        {/* ANÁLISE DE COR */}
        {selectedColor && selectedFam && selectedCor ? (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="lg:col-span-1">
              <FamilyCard
                family={selectedFam}
                forceExpanded
                selectedCorName={selectedColor.cor}
                onSelectColor={(fam, orig, corName) =>
                  setSelectedColor({
                    familia: fam,
                    origem: orig,
                    cor: corName
                  })
                }
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
                .filter(fam =>
                  !focusedFamily ||
                  focusedFamily === `${fam.familia}-${fam.origem}`
                )
                .map(fam => (
                  <FamilyCard
                    key={`${fam.familia}-${fam.origem}`}
                    family={fam}
                    onSelectColor={handleSelectColor}
                    forceExpanded={
                      focusedFamily === `${fam.familia}-${fam.origem}`
                    }
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
