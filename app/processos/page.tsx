'use client';

import { useEffect, useState } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- ADICIONADO: O Motor do Cão de Guarda

export default function MeusProcessos() {
  const router = useRouter(); // Instancia o roteador
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgao, setOrgao] = useState<any>(null);
  const [erroConexao, setErroConexao] = useState(false); // <-- ADICIONADO: Estado para gerenciar a queda do backend

  useEffect(() => {
    const carregarDados = async () => {
      // 1. O CÃO DE GUARDA (Middleare de Sessão no Client)
      const data = localStorage.getItem('licitacao_orgao_data');
      if (!data) {
        console.warn("Acesso negado. Sessão inválida ou inexistente.");
        router.replace('/login'); // Expulsa sumariamente para a tela de login
        return; 
      }

      const parsedOrgao = JSON.parse(data);
      setOrgao(parsedOrgao);
      
      try {
        // Busca os processos salvos na nuvem (AI Core)
        const response = await licitacaoService.listarDoBanco(parsedOrgao.cidade);
        if (response && response.processos) {
          setProcessos(response.processos);
        }
      } catch (error) {
        // 2. AMORTECEDOR DE IMPACTO (Impede o "Erro Vermelho" de quebrar a UI)
        console.warn("Falha de comunicação com o AI Core. Operando em modo visual (contingência).", error);
        setErroConexao(true); // Aciona o banner amigável em vez de estourar erro fatal
      } finally {
        setLoading(false); // Garante que a tela de loading suma, com sucesso ou falha
      }
    };

    carregarDados();
  }, [router]);

  const formatarData = (dataIso: string) => {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatarFase = (fase: string) => {
    if (fase === 'DFD_CONCLUIDO') return { texto: 'Fase 1: DFD', cor: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (fase === 'ETP_CONCLUIDO') return { texto: 'Fase 2: ETP', cor: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (fase === 'TR_CONCLUIDO') return { texto: 'Fase 3: TR', cor: 'bg-green-100 text-green-800 border-green-200' };
    // INJEÇÃO GO-LIVE: Reconhecimento da Fase 4 (IN 65)
    if (fase === 'PESQUISA_CONCLUIDA') return { texto: 'Fase 4: Saneado (IN 65)', cor: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    return { texto: fase, cor: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 pb-20">
      <div className="max-w-6xl mx-auto mt-6">
        
        <header className="mb-6 flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Painel de Processos (Data Moat)</h1>
            <p className="text-slate-600 text-sm">
              Visão geral de todos os processos licitatórios blindados da instituição: 
              <strong className="text-blue-700 ml-1">{orgao?.cidade || 'Não identificado'}</strong>
            </p>
          </div>
          {/* REGRESSÃO ZERO: Botão atualizado para a rota /novo */}
          <Link href="/novo" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md text-sm">
            + Novo Processo (DFD)
          </Link>
        </header>

        {/* ALERTA PROFISSIONAL DE MODO OFFLINE (Evita quebrar o sistema se o backend cair) */}
        {erroConexao && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-amber-500 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800 font-bold">Aviso de Conexão: GovTech Engine Indisponível</p>
                <p className="text-xs text-amber-700 mt-1">Não foi possível sincronizar os dados com a nuvem no momento. O sistema está operando em modo de contingência visual. Verifique a conexão com o servidor.</p>
              </div>
            </div>
          </div>
        )}

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
            {/* REGRESSÃO ZERO: Botão atualizado para a rota /novo */}
            <Link href="/novo" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-sm inline-block">
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
                      {/* EVOLUÇÃO GO-LIVE: Botão conecta direto ao módulo de Auditoria IGEP */}
                      <button 
                        onClick={() => {
                          // Salva o hash atual para a auditoria puxar automaticamente (opcional)
                          localStorage.setItem('licitacao_hash_auditoria_ativo', proc.hash_auditoria);
                          router.push('/auditoria');
                        }} 
                        className="flex-1 bg-slate-900 text-yellow-400 hover:bg-slate-800 font-bold py-2 rounded border border-slate-700 transition-colors text-xs text-center flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        Painel de Controle IGEP
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