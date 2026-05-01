import { useAPI } from '@/hooks/useAPI';
import { useState, useEffect } from 'react';

interface DashboardData {
  faturamento: number;
  lucro: number;
  cmv: number;
  margem: number;
}

export default function Home() {
  const { data: dashboardData, loading, error } = useAPI<DashboardData>({
    action: 'dashboard',
  });

  const [displayData, setDisplayData] = useState<DashboardData>({
    faturamento: 0,
    lucro: 0,
    cmv: 0,
    margem: 0,
  });

  useEffect(() => {
    if (dashboardData) {
      setDisplayData(dashboardData);
    }
  }, [dashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>La Vinicola - Sistema de Gestão</h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>Bem-vindo ao painel de gestão avançado</p>

      {error && (
        <div style={{ 
          backgroundColor: '#7f1d1d', 
          color: '#fecaca', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading && (
        <div style={{ 
          backgroundColor: '#1e3a8a', 
          color: '#93c5fd', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          Carregando dados...
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>📊 Faturamento Total</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatCurrency(displayData.faturamento)}</p>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>💰 Lucro Líquido</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#86efac' }}>{formatCurrency(displayData.lucro)}</p>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>📈 CMV Total</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{formatCurrency(displayData.cmv)}</p>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>📉 Margem de Lucro</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>{displayData.margem.toFixed(2)}%</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <a href="/cmv" style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', textDecoration: 'none', color: 'white', cursor: 'pointer', transition: 'background-color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📊 CMV</h2>
          <p>Controle de Custo da Mercadoria Vendida</p>
        </a>
        
        <a href="/estoque-avancado" style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', textDecoration: 'none', color: 'white', cursor: 'pointer', transition: 'background-color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📦 Estoque</h2>
          <p>Gestão de estoque com SEFAZ</p>
        </a>
        
        <a href="/financeiro-completo" style={{ padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', textDecoration: 'none', color: 'white', cursor: 'pointer', transition: 'background-color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>💰 Financeiro</h2>
          <p>DRE e Fluxo de Caixa</p>
        </a>
      </div>
    </div>
  );
}
