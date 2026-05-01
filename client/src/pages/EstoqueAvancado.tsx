import { useAPI } from '@/hooks/useAPI';
import { useState, useEffect } from 'react';

interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_medio: number;
  preco_venda: number;
  ativo: number;
}

export default function EstoqueAvancado() {
  const { data: produtosData, loading, error } = useAPI<Produto[]>({
    action: 'estoque_produtos',
  });

  const [displayData, setDisplayData] = useState<Produto[]>([]);
  const [totalEstoque, setTotalEstoque] = useState(0);
  const [alertas, setAlertas] = useState(0);

  useEffect(() => {
    if (produtosData && Array.isArray(produtosData)) {
      setDisplayData(produtosData);
      
      // Calcular total em estoque
      const total = produtosData.reduce((acc, p) => acc + (p.estoque_atual * p.custo_medio), 0);
      setTotalEstoque(total);
      
      // Calcular alertas de estoque mínimo
      const alertCount = produtosData.filter(p => p.estoque_atual < p.estoque_minimo).length;
      setAlertas(alertCount);
    }
  }, [produtosData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">Estoque Avançado</h1>

      {error && (
        <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-8">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading && (
        <div className="bg-blue-900 text-blue-200 p-4 rounded-lg mb-8">
          Carregando dados...
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Total em Estoque</p>
          <p className="text-3xl font-bold">{formatCurrency(totalEstoque)}</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Produtos</p>
          <p className="text-3xl font-bold">{displayData.length}</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Alertas</p>
          <p className="text-3xl font-bold text-red-400">{alertas}</p>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
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
      
      <div className="bg-slate-800 p-6 rounded-lg overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Produtos em Estoque</h2>
        
        {displayData.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2">Código</th>
                <th className="text-left py-3 px-2">Produto</th>
                <th className="text-left py-3 px-2">Categoria</th>
                <th className="text-right py-3 px-2">Estoque</th>
                <th className="text-right py-3 px-2">Mínimo</th>
                <th className="text-right py-3 px-2">Custo</th>
                <th className="text-right py-3 px-2">Preço</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((produto) => {
                const abaixoMinimo = produto.estoque_atual < produto.estoque_minimo;
                return (
                  <tr key={produto.id} className={`border-b border-slate-700 hover:bg-slate-700 ${abaixoMinimo ? 'bg-red-900 bg-opacity-20' : ''}`}>
                    <td className="py-3 px-2 font-mono text-sm">{produto.codigo}</td>
                    <td className="py-3 px-2">{produto.nome}</td>
                    <td className="py-3 px-2 text-slate-400">{produto.categoria}</td>
                    <td className="text-right py-3 px-2">{produto.estoque_atual}</td>
                    <td className="text-right py-3 px-2">{produto.estoque_minimo}</td>
                    <td className="text-right py-3 px-2">{formatCurrency(produto.custo_medio)}</td>
                    <td className="text-right py-3 px-2 text-green-400">{formatCurrency(produto.preco_venda)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-300">Nenhum produto cadastrado ainda...</p>
        )}
      </div>
    </div>
  );
}
