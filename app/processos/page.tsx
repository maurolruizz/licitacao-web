'use client';

import { useEffect, useState } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function MeusProcessos() {
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgao, setOrgao] = useState<any>(null);

  useEffect(() => {
    const carregarDados = async () => {
      const data = localStorage.getItem('licitacao_orgao_data');
      if (data) {
        const parsedOrgao = JSON.parse(data);
        setOrgao(parsedOrgao);
        
        try {
          // Busca os processos salvos na nuvem (SQLite)
          const response = await licitacaoService.listarDoBanco(parsedOrgao.cidade);
          if (response.processos) {
            setProcessos(response.processos);
          }
        } catch (error) {
          console.error("Erro ao buscar processos:", error);
        }
      }
      setLoading(false);
    };

    carregarDados();
  }, []);

  const formatarData = (dataIso: string) => {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatarFase = (fase: string) => {
    if (fase === 'DFD_CONCLUIDO') return { texto: 'Fase 1: DFD', cor: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (fase === 'ETP_CONCLUIDO') return { texto: 'Fase 2: ETP', cor: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (fase === 'TR_CONCLUIDO') return { texto: 'Fase 3: TR', cor: 'bg-green-100 text-green-800 border-green-200' };
    return { texto: fase, cor: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 pb-20">
      <div className="max-w-6xl mx-auto mt-6">
        
        <header className="mb-10 flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Painel de Processos (Data Moat)</h1>
            <p className="text-slate-600 text-sm">
              Visão geral de todos os processos licitatórios blindados da instituição: 
              <strong className="text-blue-700 ml-1">{orgao?.cidade || 'Não identificado'}</strong>
            </p>
          </div>
          <Link href="/" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md text-sm">
            + Novo Processo (DFD)
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold tracking-wide">Sincronizando com o Banco de Dados GovTech...</p>
          </div>
        ) : processos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <span className="text-5xl mb-4 block">🗂️</span>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhum processo salvo na nuvem.</h2>
            <p className="text-slate-500 mb-6">Inicie a estruturação de um novo DFD para que ele seja registrado permanentemente.</p>
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-sm inline-block">
              Iniciar Primeiro Processo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processos.map((proc, index) => {
              const faseData = formatarFase(proc.fase_atual);
              return (
                <div key={index} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-slate-300 font-mono text-xs truncate max-w-[60%]">ID: {proc.id_processo.split('-')[1] || proc.id_processo}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${faseData.cor}`}>
                      {faseData.texto}
                    </span>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2">
                      {proc.objeto.toUpperCase()}
                    </h3>
                    
                    <div className="text-xs text-slate-500 mb-4 space-y-2 flex-1">
                      <p className="flex items-center gap-2">
                        <span>📅</span> Criado em: {formatarData(proc.data_criacao)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span>🛡️</span> Hash: <span className="font-mono text-[10px] truncate max-w-[180px] bg-slate-100 px-1 rounded">{proc.hash_auditoria}</span>
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                      <button onClick={() => alert("O visualizador do documento na íntegra será acoplado aqui na próxima versão.")} className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-2 rounded border border-blue-200 transition-colors text-xs text-center">
                        👁️ Ver Histórico
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}