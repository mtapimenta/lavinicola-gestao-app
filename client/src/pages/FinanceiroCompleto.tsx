export default function FinanceiroCompleto() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">Financeiro Completo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Receitas</p>
          <p className="text-3xl font-bold text-green-400">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Despesas</p>
          <p className="text-3xl font-bold text-red-400">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">CMV</p>
          <p className="text-3xl font-bold">R$ 0,00</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Resultado</p>
          <p className="text-3xl font-bold text-blue-400">R$ 0,00</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">DRE - Demonstração de Resultado</h2>
          <div className="space-y-2 text-slate-300">
            <p>Receita Bruta: R$ 0,00</p>
            <p>CMV: R$ 0,00</p>
            <p>Lucro Bruto: R$ 0,00</p>
            <p>Despesas Operacionais: R$ 0,00</p>
            <p className="font-bold text-white">Resultado Líquido: R$ 0,00</p>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Fluxo de Caixa</h2>
          <div className="space-y-2 text-slate-300">
            <p>Saldo Inicial: R$ 0,00</p>
            <p>Entradas: R$ 0,00</p>
            <p>Saídas: R$ 0,00</p>
            <p className="font-bold text-white">Saldo Final: R$ 0,00</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Contas a Receber</h2>
        <p className="text-slate-300">Nenhuma conta cadastrada...</p>
      </div>
    </div>
  );
}
