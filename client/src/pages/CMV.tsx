export default function CMV() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">CMV - Custo da Mercadoria Vendida</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Estoque Inicial</p>
          <p className="text-3xl font-bold">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Compras</p>
          <p className="text-3xl font-bold">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Estoque Final</p>
          <p className="text-3xl font-bold">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">CMV %</p>
          <p className="text-3xl font-bold text-amber-400">0,00%</p>
        </div>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Fórmula: (EI + Compras - EF) / Faturamento</h2>
        <p className="text-slate-300">Dados aguardando integração com banco de dados...</p>
      </div>
    </div>
  );
}
