export default function EstoqueAvancado() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">Estoque Avançado</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Total em Estoque</p>
          <p className="text-3xl font-bold">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Produtos</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Alertas</p>
          <p className="text-3xl font-bold text-red-400">0</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">
          📤 Importar NF-e (XML)
        </button>
        
        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">
          📥 Exportar Inventário
        </button>
        
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg">
          ➕ Nova Entrada
        </button>
      </div>
      
      <div className="mt-8 bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Produtos em Estoque</h2>
        <p className="text-slate-300">Nenhum produto cadastrado ainda...</p>
      </div>
    </div>
  );
}
