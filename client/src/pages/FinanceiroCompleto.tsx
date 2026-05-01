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

interface HistoricoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  cmv: number;
  resultado: number;
}

interface ProjecaoSemana {
  semana: string;
  inicio: string;
  fim: string;
  entradas: number;
  saidas: number;
  liquido: number;
}

interface FinanceiroData {
  periodo?: { mes: number; ano: number };
  dre: {
    receitas: number;
    despesas: number;
    cmv: number;
    cmv_real?: number;
    despesasOp: number;
    lucroBruto?: number;
    resultado: number;
    margem?: number;
    historico: HistoricoMensal[];
  };
  fluxoCaixa: {
    saldoInicial: number;
    entradasProjetadas: number;
    saidasProjetadas: number;
    saldoFinal: number;
    projecao: ProjecaoSemana[];
  };
  contas: {
    pagar: ContaFinanceira[];
    receber: ContaFinanceira[];
    total_pagar?: number;
    total_receber?: number;
  };
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function FinanceiroCompleto() {
  const hoje = new Date();
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1);
  const [ano, setAno] = useState<number>(hoje.getFullYear());
  const [statusPagar, setStatusPagar] = useState<string>('');
  const [statusReceber, setStatusReceber] = useState<string>('');

  const { data: financeiroData, loading, error } = useAPI<FinanceiroData>({
    action: 'financeiro_dados',
    params: {
      mes,
      ano,
      status_pagar: statusPagar || undefined,
      status_receber: statusReceber || undefined,
    },
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
    }).format(value || 0);
  };

  const anosDisponiveis = [hoje.getFullYear() - 2, hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <a href="/" className="text-blue-400 hover:underline mb-4 inline-block">← Voltar</a>
      
      <h1 className="text-4xl font-bold mb-8">Financeiro Completo</h1>

      {/* Filtros de período - mantém estilo dos cards do sistema */}
      <div className="bg-slate-800 p-4 rounded-lg mb-8 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-slate-400 text-sm mr-2">Mês:</label>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="bg-slate-700 text-white px-3 py-2 rounded"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-sm mr-2">Ano:</label>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="bg-slate-700 text-white px-3 py-2 rounded"
          >
            {anosDisponiveis.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setMes(hoje.getMonth() + 1); setAno(hoje.getFullYear()); }}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
        >
          Mês atual
        </button>
      </div>

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
              {displayData.dre.cmv_real !== undefined && displayData.dre.cmv_real > 0 && (
                <p className="text-xs text-slate-500 mt-1">CMV real (estoque)</p>
              )}
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <p className="text-slate-400 mb-2">Resultado</p>
              <p className={`text-3xl font-bold ${displayData.dre.resultado >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatCurrency(displayData.dre.resultado)}
              </p>
              {displayData.dre.margem !== undefined && (
                <p className="text-xs text-slate-500 mt-1">Margem: {displayData.dre.margem.toFixed(2)}%</p>
              )}
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
                  <span>(-) CMV:</span>
                  <span className="text-white">{formatCurrency(displayData.dre.cmv)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span>(=) Lucro Bruto:</span>
                  <span className="text-white">
                    {formatCurrency(displayData.dre.lucroBruto ?? (displayData.dre.receitas - displayData.dre.cmv))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Despesas Operacionais:</span>
                  <span className="text-white">{formatCurrency(displayData.dre.despesasOp)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between font-bold text-white">
                  <span>(=) Resultado Líquido:</span>
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
                  <span>(+) Entradas Projetadas:</span>
                  <span className="text-green-400">{formatCurrency(displayData.fluxoCaixa.entradasProjetadas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Saídas Projetadas:</span>
                  <span className="text-red-400">{formatCurrency(displayData.fluxoCaixa.saidasProjetadas)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between font-bold text-white">
                  <span>(=) Saldo Final:</span>
                  <span className={displayData.fluxoCaixa.saldoFinal >= 0 ? 'text-blue-400' : 'text-red-400'}>
                    {formatCurrency(displayData.fluxoCaixa.saldoFinal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico mensal de DRE - novo recurso */}
          {displayData.dre.historico && displayData.dre.historico.length > 0 && (
            <div className="bg-slate-800 p-6 rounded-lg mb-8 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">Histórico Mensal (últimos 6 meses)</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2">Mês</th>
                    <th className="text-right py-2 px-2">Receitas</th>
                    <th className="text-right py-2 px-2">Despesas</th>
                    <th className="text-right py-2 px-2">CMV</th>
                    <th className="text-right py-2 px-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.dre.historico.map((h, i) => (
                    <tr key={i} className="border-b border-slate-700 hover:bg-slate-700">
                      <td className="py-2 px-2">{h.mes}</td>
                      <td className="text-right py-2 px-2 text-green-400">{formatCurrency(h.receitas)}</td>
                      <td className="text-right py-2 px-2 text-red-400">{formatCurrency(h.despesas)}</td>
                      <td className="text-right py-2 px-2">{formatCurrency(h.cmv)}</td>
                      <td className={`text-right py-2 px-2 ${h.resultado >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatCurrency(h.resultado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Projeção semanal de fluxo de caixa - novo recurso */}
          {displayData.fluxoCaixa.projecao && displayData.fluxoCaixa.projecao.length > 0 && (
            <div className="bg-slate-800 p-6 rounded-lg mb-8 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">Projeção de Fluxo de Caixa (próximas 4 semanas)</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2">Período</th>
                    <th className="text-right py-2 px-2">Entradas</th>
                    <th className="text-right py-2 px-2">Saídas</th>
                    <th className="text-right py-2 px-2">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.fluxoCaixa.projecao.map((p, i) => (
                    <tr key={i} className="border-b border-slate-700 hover:bg-slate-700">
                      <td className="py-2 px-2">{p.semana} ({p.inicio} a {p.fim})</td>
                      <td className="text-right py-2 px-2 text-green-400">{formatCurrency(p.entradas)}</td>
                      <td className="text-right py-2 px-2 text-red-400">{formatCurrency(p.saidas)}</td>
                      <td className={`text-right py-2 px-2 ${p.liquido >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatCurrency(p.liquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Contas a Pagar</h2>
                <select
                  value={statusPagar}
                  onChange={(e) => setStatusPagar(e.target.value)}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="pago">Pagos</option>
                  <option value="atrasado">Atrasados</option>
                </select>
              </div>
              {displayData.contas.total_pagar !== undefined && (
                <p className="text-slate-400 text-sm mb-2">
                  Total: <span className="text-red-400 font-bold">{formatCurrency(displayData.contas.total_pagar)}</span>
                </p>
              )}
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Contas a Receber</h2>
                <select
                  value={statusReceber}
                  onChange={(e) => setStatusReceber(e.target.value)}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="recebido">Recebidos</option>
                  <option value="atrasado">Atrasados</option>
                </select>
              </div>
              {displayData.contas.total_receber !== undefined && (
                <p className="text-slate-400 text-sm mb-2">
                  Total: <span className="text-green-400 font-bold">{formatCurrency(displayData.contas.total_receber)}</span>
                </p>
              )}
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
