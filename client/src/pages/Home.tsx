export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>La Vinicola - Sistema de Gestão</h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>Bem-vindo ao painel de gestão avançado</p>
      
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
