import { useAPI } from '@/hooks/useAPI';
import { useState, useEffect } from 'react';

interface ContaFinanceira {
  id: number;
  descricao: string;
  valor: number;
  vencimento?: string;
  data_vencimento?: string;
  status: string;
}

interface FinanceiroData {
  dre: {
    receitas: number;
    despesas: number;
    cmv: number;
    despesasOp: number;
    resultado: number;
    historico: any[];
  };
  fluxoCaixa: {
    saldoInicial: number;
    entradasProjetadas: number;
    saidasProjetadas: number;
    saldoFinal: number;
    projecao: any[];
  };
  contas: {
    pagar: ContaFinanceira[];
    receber: ContaFinanceira[];
  };
}

export default function FinanceiroCompleto() {
  const { data: financeiroData, loading, error } = useAPI<FinanceiroData>({
    action: 'financeiro_dados',
  });

  const [displayData, setDisplayData] = useState<FinanceiroData | null>(null);

  useEffect(() => {
    if (financeiroData) {
      setDisplayData(financeiroData);
    }
  }, [financeiroData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">Financeiro Completo</h1>

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
      
      {displayData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-400 mb-2">Receitas</p>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(displayData.dre.receitas)}</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-400 mb-2">Despesas</p>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(displayData.dre.despesas)}</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-400 mb-2">CMV</p>
              <p className="text-3xl font-bold">{formatCurrency(displayData.dre.cmv)}</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-400 mb-2">Resultado</p>
              <p className="text-3xl font-bold text-blue-400">{formatCurrency(displayData.dre.resultado)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">DRE - Demonstração de Resultado</h2>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Receita Bruta:</span>
                  <span className="text-white">{formatCurrency(displayData.dre.receitas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CMV:</span>
                  <span className="text-white">{formatCurrency(displayData.dre.cmv)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro Bruto:</span>
                  <span className="text-white">{formatCurrency(displayData.dre.receitas - displayData.dre.cmv)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Despesas Operacionais:</span>
                  <span className="text-white">{formatCurrency(displayData.dre.despesasOp)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between font-bold text-white">
                  <span>Resultado Líquido:</span>
                  <span>{formatCurrency(displayData.dre.resultado)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Fluxo de Caixa</h2>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Saldo Inicial:</span>
                  <span className="text-white">{formatCurrency(displayData.fluxoCaixa.saldoInicial)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entradas:</span>
                  <span className="text-green-400">{formatCurrency(displayData.fluxoCaixa.entradasProjetadas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saídas:</span>
                  <span className="text-red-400">{formatCurrency(displayData.fluxoCaixa.saidasProjetadas)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between font-bold text-white">
                  <span>Saldo Final:</span>
                  <span>{formatCurrency(displayData.fluxoCaixa.saldoFinal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">Contas a Pagar</h2>
              {displayData.contas.pagar && displayData.contas.pagar.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2">Descrição</th>
                      <th className="text-right py-2 px-2">Valor</th>
                      <th className="text-left py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.contas.pagar.map((conta) => (
                      <tr key={conta.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="py-2 px-2">{conta.descricao}</td>
                        <td className="text-right py-2 px-2 text-red-400">{formatCurrency(conta.valor)}</td>
                        <td className="py-2 px-2 text-slate-400">{conta.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-300">Nenhuma conta a pagar...</p>
              )}
            </div>

            <div className="bg-slate-800 p-6 rounded-lg overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">Contas a Receber</h2>
              {displayData.contas.receber && displayData.contas.receber.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2">Descrição</th>
                      <th className="text-right py-2 px-2">Valor</th>
                      <th className="text-left py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.contas.receber.map((conta) => (
                      <tr key={conta.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="py-2 px-2">{conta.descricao}</td>
                        <td className="text-right py-2 px-2 text-green-400">{formatCurrency(conta.valor)}</td>
                        <td className="py-2 px-2 text-slate-400">{conta.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-300">Nenhuma conta a receber...</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
