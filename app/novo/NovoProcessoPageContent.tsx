"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { licitacaoService } from '../../services/licitacaoService';
import { LegalExplanationPanel } from '../../components/LegalExplanationPanel';
import { buildDfdPath } from '../../lib/processUrl';

export default function NovoProcessoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';

  // Estado que controla em qual tela o usuário está
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);

  // Estados para armazenar os dados digitados pelo usuário
  const [objeto, setObjeto] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  
  // Estados específicos para Dispensa
  const [incisoDispensa, setIncisoDispensa] = useState('');
  const [justificativaPreco, setJustificativaPreco] = useState('');

  // Estados específicos para Inexigibilidade
  const [razaoEscolha, setRazaoEscolha] = useState('');

  // ESTADOS DE CONTROLE PROFISSIONAL
  const [alertaCompliance, setAlertaCompliance] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // <-- ADICIONADO: Previne cliques duplos

  // Limites Legais Hardcoded (Lei 14.133)
  const LIMITE_OBRAS_SERVICOS_ENG = 119812.02;
  const LIMITE_COMPRAS_OUTROS = 59906.02;

  // Função para aplicar travas matemáticas, salvar e redirecionar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertaCompliance(null);
    setIsSubmitting(true); // Trava o botão e mostra "Processando..."

    const valorNumerico = parseFloat(valorEstimado);

    // ==========================================
    // TRAVA MATEMÁTICA 1: LIMITES DE DISPENSA
    // ==========================================
    if (tipoSelecionado === 'DISPENSA') {
      if (incisoDispensa === 'inciso_i' && valorNumerico > LIMITE_OBRAS_SERVICOS_ENG) {
        setAlertaCompliance(`ALERTA DE COMPLIANCE: O valor estimado (R$ ${valorNumerico.toFixed(2)}) ultrapassa o limite legal para Dispensa de Obras e Serviços de Engenharia (R$ 119.812,02). O sistema bloqueou a continuidade para evitar apontamento no TCU. Mude para a rota de Licitação.`);
        setIsSubmitting(false);
        return; 
      }
      
      if (incisoDispensa === 'inciso_ii' && valorNumerico > LIMITE_COMPRAS_OUTROS) {
        setAlertaCompliance(`ALERTA DE COMPLIANCE: O valor estimado (R$ ${valorNumerico.toFixed(2)}) ultrapassa o limite legal para Dispensa de Compras e Outros Serviços (R$ 59.906,02). O sistema bloqueou a continuidade para evitar apontamento no TCU. Mude para a rota de Licitação.`);
        setIsSubmitting(false);
        return; 
      }
    }

    const orgaoDataRaw = typeof window !== 'undefined' ? localStorage.getItem('licitacao_orgao_data') : null;
    if (!orgaoDataRaw) {
      setAlertaCompliance("Configure o órgão antes de criar o processo. Acesse a tela inicial ou Meus Processos para conectar o município (Censo/IBGE).");
      setIsSubmitting(false);
      return;
    }
    const orgaoData = JSON.parse(orgaoDataRaw);
    const orgao_cidade = orgaoData.cidade;
    if (!orgao_cidade) {
      setAlertaCompliance("Dados do órgão incompletos. Reconecte o município na tela inicial.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      tipoContratacao: tipoSelecionado,
      objeto,
      valorEstimado: valorNumerico,
      incisoDispensa,
      justificativaPreco,
      razaoEscolha,
      orgao_cidade
    };

    try {
      console.log('[FLOW] Criando processo...');
      const resposta = await licitacaoService.iniciarProcesso(payload);
      const idProcesso = resposta?.id_processo;
      const regime = (tipoSelecionado || '').toLowerCase();
      if (!idProcesso) {
        setAlertaCompliance('Resposta do servidor sem identificador do processo. Tente novamente.');
        setIsSubmitting(false);
        return;
      }
      // Pipeline fix: SEMPRE ir para /dfd após Verificar Compliance. Nunca redirecionar para /processos.
      const rotaDestino = (resposta?.rota_destino && resposta.rota_destino.startsWith('/dfd'))
        ? resposta.rota_destino
        : buildDfdPath(idProcesso, regime);
      // Persistir ANTES da navegação para evitar race: useSearchParams pode vir vazio no primeiro render de /dfd.
      if (typeof window !== 'undefined') {
        localStorage.setItem('licitacao_id_processo', idProcesso);
        localStorage.setItem('licitacao_regime', regime);
      }
      console.log('[FLOW] Rota destino:', rotaDestino);
      router.push(rotaDestino);
    } catch (error: any) {
      setAlertaCompliance(error?.message || "Erro de conexão com o servidor. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  // TELA 1: SE NÃO ESCOLHEU NENHUM TIPO AINDA, MOSTRA OS 3 BOTÕES
  if (!tipoSelecionado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-slate-100">
        <div className="max-w-5xl w-full">
          <h2 className="text-4xl font-bold text-center mb-3 text-white">Qual o Regime Jurídico desta Demanda?</h2>
          <p className="text-center text-slate-400 mb-12 text-lg">O LicitaIA adaptará a fase preparatória automaticamente.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button onClick={() => { setTipoSelecionado('LICITACAO'); setAlertaCompliance(null); }} className="bg-slate-800 border-2 border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer shadow-xl hover:shadow-blue-500/20 group">
              <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Licitação</h3>
              <p className="text-base text-slate-400">Pregão ou Concorrência. Fluxo completo com DFD, ETP e TR.</p>
            </button>

            <button onClick={() => { setTipoSelecionado('DISPENSA'); setAlertaCompliance(null); }} className="bg-slate-800 border-2 border-slate-700 hover:border-green-500 hover:bg-slate-800/80 transition-all rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer shadow-xl hover:shadow-green-500/20 group">
              <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Dispensa</h3>
              <p className="text-base text-slate-400">Contratação Direta (Art. 75). ETP dispensado. TR Simplificado.</p>
            </button>

            <button onClick={() => { setTipoSelecionado('INEXIGIBILIDADE'); setAlertaCompliance(null); }} className="bg-slate-800 border-2 border-slate-700 hover:border-purple-500 hover:bg-slate-800/80 transition-all rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer shadow-xl hover:shadow-purple-500/20 group">
              <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Inexigibilidade</h3>
              <p className="text-base text-slate-400">Fornecedor Exclusivo (Art. 74). Foco em justificativa e prova.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA 2: FORMULÁRIO DINÂMICO
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-8 font-sans text-slate-100">
      
      <div className="max-w-4xl w-full mb-8">
        <button onClick={() => { setTipoSelecionado(null); setAlertaCompliance(null); }} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Voltar para Regimes
        </button>
      </div>

      <div className="max-w-4xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className={`p-8 border-b border-slate-700 ${tipoSelecionado === 'DISPENSA' ? 'bg-green-500/10' : tipoSelecionado === 'INEXIGIBILIDADE' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
          <h2 className="text-3xl font-bold text-white uppercase flex items-center gap-4">
            <span className={`w-4 h-4 rounded-full shadow-lg ${tipoSelecionado === 'DISPENSA' ? 'bg-green-500 shadow-green-500/50' : tipoSelecionado === 'INEXIGIBILIDADE' ? 'bg-purple-500 shadow-purple-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}></span>
            Formulário: {tipoSelecionado}
          </h2>
          <p className="text-slate-400 mt-3 text-lg">
            Preencha os dados primários. Nossos módulos robustos de ETP e TR se adaptarão ao regime escolhido.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">

          {sessionExpired && (
            <div className="bg-amber-900/40 border-l-4 border-amber-500 p-5 rounded-r-lg">
              <p className="text-amber-200 font-semibold">Contexto de processo não encontrado. Inicie um novo processo abaixo.</p>
            </div>
          )}
          
          {alertaCompliance && (
            <div className="bg-red-900/40 border-l-4 border-red-500 p-5 rounded-r-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-red-200 font-semibold">{alertaCompliance}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-3">Dados da Demanda (DFD)</h3>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Objeto da Contratação *</label>
              <input type="text" value={objeto} onChange={(e) => setObjeto(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ex: Aquisição de computadores para a Secretaria de Educação..." required disabled={isSubmitting} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Valor Estimado Global (R$) *</label>
              <input type="number" step="0.01" value={valorEstimado} onChange={(e) => { setValorEstimado(e.target.value); setAlertaCompliance(null); }} className={`w-full bg-slate-900 border ${alertaCompliance ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'} rounded-xl p-4 text-white focus:outline-none focus:ring-1`} placeholder="Ex: 50000.00" required disabled={isSubmitting} />
            </div>
          </div>

          {tipoSelecionado === 'DISPENSA' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xl font-semibold text-green-400 border-b border-slate-700 pb-3">Governança da Dispensa</h3>
              <LegalExplanationPanel variant="dispensa" dark className="rounded-xl" />
              {incisoDispensa && valorEstimado && !alertaCompliance && (() => {
                const v = parseFloat(valorEstimado);
                const dentroLimite = (incisoDispensa === 'inciso_i' && v <= LIMITE_OBRAS_SERVICOS_ENG) || (incisoDispensa === 'inciso_ii' && v <= LIMITE_COMPRAS_OUTROS) || incisoDispensa === 'emergencia';
                return dentroLimite ? <LegalExplanationPanel variant="valor_dentro_limite" dark className="rounded-xl" /> : null;
              })()}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Fundamento Legal (Art. 75) *</label>
                <select value={incisoDispensa} onChange={(e) => { setIncisoDispensa(e.target.value); setAlertaCompliance(null); }} className={`w-full bg-slate-900 border ${alertaCompliance ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-green-500 focus:ring-green-500'} rounded-xl p-4 text-white focus:outline-none focus:ring-1`} required disabled={isSubmitting}>
                  <option value="" disabled>Selecione a justificativa legal...</option>
                  <option value="inciso_i">Inciso I - Obras e Serviços de Engenharia (Até R$ 119.812,02)</option>
                  <option value="inciso_ii">Inciso II - Compras e Outros Serviços (Até R$ 59.906,02)</option>
                  <option value="emergencia">Emergência ou Calamidade Pública</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Justificativa de Preço *</label>
                <textarea value={justificativaPreco} onChange={(e) => setJustificativaPreco(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="Justifique como obteve a compatibilidade do preço com o mercado..." required disabled={isSubmitting}></textarea>
              </div>
            </div>
          )}

          {tipoSelecionado === 'INEXIGIBILIDADE' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xl font-semibold text-purple-400 border-b border-slate-700 pb-3">Governança da Inexigibilidade</h3>
              <LegalExplanationPanel variant="inexigibilidade" dark className="rounded-xl" />
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Razão da Escolha do Contratado *</label>
                <textarea value={razaoEscolha} onChange={(e) => setRazaoEscolha(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="Explique por que apenas este fornecedor pode atender a demanda..." required disabled={isSubmitting}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Anexar Comprovante de Exclusividade (Opcional nesta etapa)</label>
                <input type="file" accept=".pdf" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30 cursor-pointer" disabled={isSubmitting} />
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-5 rounded-xl font-bold text-xl shadow-lg transition-all flex justify-center items-center gap-2 ${
                isSubmitting ? 'bg-slate-600 cursor-not-allowed text-slate-300' :
                tipoSelecionado === 'DISPENSA' ? 'bg-green-600 hover:bg-green-500 text-white' : 
                tipoSelecionado === 'INEXIGIBILIDADE' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 
                'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processando e Salvando...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Verificar Compliance e Criar Processo
                </>
              )}
            </button>
          </div>

        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}