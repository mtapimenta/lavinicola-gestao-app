import { useAPI } from '@/hooks/useAPI';
import { useState, useEffect } from 'react';

interface CMVRow {
  mes: string;
  ei: number;
  compras: number;
  ef: number;
  custoTotal: number;
  faturamento: number;
  percentual: number;
}

export default function CMV() {
  const { data: cmvData, loading, error } = useAPI<CMVRow[]>({
    action: 'cmv_data',
  });

  const [displayData, setDisplayData] = useState<CMVRow[]>([]);

  useEffect(() => {
    if (cmvData && Array.isArray(cmvData)) {
      setDisplayData(cmvData);
    }
  }, [cmvData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">CMV - Custo da Mercadoria Vendida</h1>

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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Estoque Inicial</p>
          <p className="text-3xl font-bold">{formatCurrency(displayData[0]?.ei || 0)}</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Compras</p>
          <p className="text-3xl font-bold">{formatCurrency(displayData[0]?.compras || 0)}</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">Estoque Final</p>
          <p className="text-3xl font-bold">{formatCurrency(displayData[0]?.ef || 0)}</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-400 mb-2">CMV %</p>
          <p className="text-3xl font-bold text-amber-400">{(displayData[0]?.percentual || 0).toFixed(2)}%</p>
        </div>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Histórico Mensal</h2>
        <p className="text-slate-300 mb-4">Fórmula: CMV = (EI + Compras - EF) / Faturamento × 100</p>
        
        {displayData.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2">Mês</th>
                <th className="text-right py-3 px-2">EI</th>
                <th className="text-right py-3 px-2">Compras</th>
                <th className="text-right py-3 px-2">EF</th>
                <th className="text-right py-3 px-2">Custo Total</th>
                <th className="text-right py-3 px-2">Faturamento</th>
                <th className="text-right py-3 px-2">%</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700">
                  <td className="py-3 px-2">{row.mes}</td>
                  <td className="text-right py-3 px-2">{formatCurrency(row.ei)}</td>
                  <td className="text-right py-3 px-2">{formatCurrency(row.compras)}</td>
                  <td className="text-right py-3 px-2">{formatCurrency(row.ef)}</td>
                  <td className="text-right py-3 px-2">{formatCurrency(row.custoTotal)}</td>
                  <td className="text-right py-3 px-2">{formatCurrency(row.faturamento)}</td>
                  <td className="text-right py-3 px-2 text-amber-400">{row.percentual.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-300">Nenhum dado disponível...</p>
        )}
      </div>
    </div>
  );
}
