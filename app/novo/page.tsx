"use client";

import React, { useState } from 'react';

export default function NovoProcessoPage() {
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

  // Função para enviar os dados para o nosso backend
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tipoContratacao: tipoSelecionado,
      objeto,
      valorEstimado,
      incisoDispensa,
      justificativaPreco,
      razaoEscolha
    };
    
    console.log("Enviando para o Backend com Regressão Zero:", payload);
    alert(`Processo de ${tipoSelecionado} iniciado com sucesso!`);
  };

  // TELA 1: SE NÃO ESCOLHEU NENHUM TIPO AINDA, MOSTRA OS 3 BOTÕES
  if (!tipoSelecionado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-slate-100">
        <div className="max-w-5xl w-full">
          <h2 className="text-4xl font-bold text-center mb-3 text-white">Qual o Regime Jurídico desta Demanda?</h2>
          <p className="text-center text-slate-400 mb-12 text-lg">O LicitaIA adaptará a fase preparatória automaticamente.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Botão Licitação */}
            <button 
              onClick={() => setTipoSelecionado('LICITACAO')}
              className="bg-slate-800 border-2 border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer shadow-xl hover:shadow-blue-500/20 group"
            >
              <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Licitação</h3>
              <p className="text-base text-slate-400">Pregão ou Concorrência. Fluxo completo com DFD, ETP e TR.</p>
            </button>

            {/* Botão Dispensa */}
            <button 
              onClick={() => setTipoSelecionado('DISPENSA')}
              className="bg-slate-800 border-2 border-slate-700 hover:border-green-500 hover:bg-slate-800/80 transition-all rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer shadow-xl hover:shadow-green-500/20 group"
            >
              <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Dispensa</h3>
              <p className="text-base text-slate-400">Contratação Direta (Art. 75). ETP dispensado. TR Simplificado.</p>
            </button>

            {/* Botão Inexigibilidade */}
            <button 
              onClick={() => setTipoSelecionado('INEXIGIBILIDADE')}
              className="bg-slate-800 border-2 border-slate-700 hover:border-purple-500 hover:bg-slate-800/80 transition-all rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer shadow-xl hover:shadow-purple-500/20 group"
            >
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
        <button 
          onClick={() => setTipoSelecionado(null)} 
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Voltar para Regimes
        </button>
      </div>

      <div className="max-w-4xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Cabeçalho */}
        <div className={`p-8 border-b border-slate-700 ${
            tipoSelecionado === 'DISPENSA' ? 'bg-green-500/10' : 
            tipoSelecionado === 'INEXIGIBILIDADE' ? 'bg-purple-500/10' : 
            'bg-blue-500/10'
          }`}>
          <h2 className="text-3xl font-bold text-white uppercase flex items-center gap-4">
            <span className={`w-4 h-4 rounded-full shadow-lg ${
              tipoSelecionado === 'DISPENSA' ? 'bg-green-500 shadow-green-500/50' : 
              tipoSelecionado === 'INEXIGIBILIDADE' ? 'bg-purple-500 shadow-purple-500/50' : 
              'bg-blue-500 shadow-blue-500/50'
            }`}></span>
            Formulário: {tipoSelecionado}
          </h2>
          <p className="text-slate-400 mt-3 text-lg">
            Preencha os dados primários. O Motor de Conformidade cuidará do resto.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="space-y-5">
            <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-3">Dados da Demanda (DFD)</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Objeto da Contratação *</label>
              <input 
                type="text" 
                value={objeto}
                onChange={(e) => setObjeto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Aquisição de computadores para a Secretaria de Educação..."
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Valor Estimado Global (R$) *</label>
              <input 
                type="number" 
                value={valorEstimado}
                onChange={(e) => setValorEstimado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: 50000"
                required 
              />
            </div>
          </div>

          {tipoSelecionado === 'DISPENSA' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xl font-semibold text-green-400 border-b border-slate-700 pb-3">Governança da Dispensa</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Fundamento Legal (Art. 75) *</label>
                <select 
                  value={incisoDispensa}
                  onChange={(e) => setIncisoDispensa(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  required
                >
                  <option value="" disabled>Selecione a justificativa legal...</option>
                  <option value="inciso_i">Inciso I - Obras e Serviços de Engenharia (Até R$ 119.812,02)</option>
                  <option value="inciso_ii">Inciso II - Compras e Outros Serviços (Até R$ 59.906,02)</option>
                  <option value="emergencia">Emergência ou Calamidade Pública</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Justificativa de Preço *</label>
                <textarea 
                  value={justificativaPreco}
                  onChange={(e) => setJustificativaPreco(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="Justifique como obteve a compatibilidade do preço com o mercado..."
                  required 
                ></textarea>
              </div>
            </div>
          )}

          {tipoSelecionado === 'INEXIGIBILIDADE' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xl font-semibold text-purple-400 border-b border-slate-700 pb-3">Governança da Inexigibilidade</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Razão da Escolha do Contratado *</label>
                <textarea 
                  value={razaoEscolha}
                  onChange={(e) => setRazaoEscolha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Explique por que apenas este fornecedor pode atender a demanda..."
                  required 
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Anexar Comprovante de Exclusividade (PDF)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit" 
              className={`w-full py-5 rounded-xl font-bold text-xl shadow-lg transition-all ${
                tipoSelecionado === 'DISPENSA' ? 'bg-green-600 hover:bg-green-500 text-white' : 
                tipoSelecionado === 'INEXIGIBILIDADE' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 
                'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Iniciar Fase Preparatória (IA)
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