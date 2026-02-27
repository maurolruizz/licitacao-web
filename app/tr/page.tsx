'use client';

import { useState, useEffect } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaTR() {
  const [objeto, setObjeto] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  
  // TRAVA DE WORKFLOW (Governança Sistêmica)
  const [bloqueado, setBloqueado] = useState(false);
  const [modoPequeno, setModoPequeno] = useState(false);

  useEffect(() => {
    const objetoSalvo = localStorage.getItem('licitacao_objeto');
    const especificacaoSalva = localStorage.getItem('licitacao_especificacao');
    
    if (objetoSalvo && especificacaoSalva) {
      setObjeto(objetoSalvo);
      setEspecificacao(especificacaoSalva);
    } else {
      // Bloqueia a geração do TR se o ETP não tiver sido feito
      setBloqueado(true);
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [justificativa, setJustificativa] = useState('');
  const [obrigacoes, setObrigacoes] = useState('');
  const [prazoLocal, setPrazoLocal] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [modeloGestao, setModeloGestao] = useState('');
  const [sancoes, setSancoes] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);

  // MODO MUNICÍPIO PEQUENO (Facilitador de UX exigido pelo consultor)
  const ativarModoPequeno = () => {
    const ativo = !modoPequeno;
    setModoPequeno(ativo);
    if (ativo) {
      setModeloGestao("Fiscalização direta pelo servidor designado através de portaria, com ateste em nota fiscal após conferência quantitativa e qualitativa.");
      setSancoes("Apenas advertência e multa moratória leve, aplicável a objetos de pronta entrega e baixo risco.");
      setPagamento("Em até 30 dias após o ateste da nota fiscal");
    } else {
      setModeloGestao("");
      setSancoes("");
      setPagamento("");
    }
  };

  const limparMemoria = () => {
    localStorage.removeItem('licitacao_objeto');
    localStorage.removeItem('licitacao_especificacao');
    window.location.reload();
  };

  const prepararEnvio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalAberto(true);
  };

  const executarEnvioBlindado = async () => {
    setModalAberto(false);
    setLoading(true);
    setErro(null);

    const payload = {
      objeto_da_compra: objeto || 'Não informado',
      especificacao_tecnica: especificacao || 'Não informada',
      justificativa_contratacao: justificativa || 'Não informada',
      prazo_e_local_entrega: prazoLocal || 'Não informado',
      criterios_de_pagamento: pagamento || 'Não informado',
      obrigacoes_contratada: obrigacoes || 'Não informadas',
      modelo_execucao_gestao: modeloGestao || 'Não selecionado',
      sancoes_aplicaveis: sancoes || 'Não selecionadas'
    };

    try {
      const data = await licitacaoService.gerarTR(payload);
      setResultado(data);
      // Registrando a passagem pelo TR para o Modo Auditoria
      localStorage.setItem('licitacao_tr_status', 'concluido');
    } catch (err: any) {
      setErro(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const exportarParaWord = () => {
    if (!resultado) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Termo de Referência Oficial</title></head><body>";
    const footer = "</body></html>";
    const htmlText = resultado.texto_oficial.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 11pt; text-align: justify; line-height: 1.5; margin-bottom: 6px;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    fileDownload.href = url;
    fileDownload.download = 'TR_Oficial_Auditavel.doc';
    document.body.appendChild(fileDownload);
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  };

  if (bloqueado) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 p-8 rounded-xl border border-red-500/50 max-w-lg text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Workflow Bloqueado</h2>
          <p className="text-slate-400 mb-6">A Lei 14.133/2021 exige que o Estudo Técnico Preliminar (ETP) seja concluído antes da elaboração do Termo de Referência.</p>
          <Link href="/etp" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block">
            Ir para a Fase 2 (ETP)
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm flex justify-between items-center px-6">
          <span>MÓDULO DE GOVERNANÇA E COMPLIANCE - LEI 14.133/2021</span>
          <button onClick={ativarModoPequeno} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${modoPequeno ? 'bg-yellow-500 text-yellow-900' : 'bg-slate-700 text-slate-300'}`}>
            {modoPequeno ? '🚀 Modo Município Pequeno: Ativo' : 'Ativar Modo Município Pequeno'}
          </button>
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-200 items-center">
          <Link href="/" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 1. DFD</Link>
          <Link href="/etp" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 2. ETP</Link>
          <span className="text-green-800 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-md shadow-sm">3. TR</span>
          <Link href="/pesquisa" className="text-slate-600 hover:text-indigo-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">4. IN 65 →</Link>
          <Link href="/auditoria" className="ml-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-1.5 rounded-md transition-all font-bold">🛡️ Auditoria</Link>
        </nav>
        
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-green-900">Termo de Referência (TR)</h1>
            <p className="text-slate-500 text-sm mt-1">Estruturação Executiva (Art. 6º, XXIII) com Auto-Importação</p>
          </div>
          <button type="button" onClick={limparMemoria} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md font-bold transition-colors border border-red-200 shadow-sm">
            🗑️ Forçar Limpeza (Teste de Trava)
          </button>
        </header>
        
        <form onSubmit={prepararEnvio} className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          
          <div className="space-y-6">
            <div className="flex flex-col border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r-md">
              <label className="text-sm font-semibold mb-1 flex items-center gap-2 text-green-900">Objeto (Blindado pelo ETP)</label>
              <input value={objeto} readOnly className="p-3 border border-green-200 rounded-md outline-none bg-slate-100 font-medium text-slate-600 cursor-not-allowed" />
            </div>

            <div className="flex flex-col border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r-md">
              <label className="text-sm font-semibold mb-1 flex items-center gap-2 text-green-900">Especificações Técnicas (Blindado pelo ETP)</label>
              <textarea value={especificacao} readOnly rows={4} className="p-3 border border-green-200 rounded-md outline-none bg-slate-100 font-medium leading-relaxed text-slate-600 cursor-not-allowed" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Prazo e Local de Entrega</label>
              <input value={prazoLocal} onChange={(e) => setPrazoLocal(e.target.value)} required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 15 dias na Sede da Prefeitura" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Justificativa da Contratação</label>
              <textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} required rows={2} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" placeholder="Motivo fático que justifica a despesa..." />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Obrigações da Contratada</label>
              <textarea value={obrigacoes} onChange={(e) => setObrigacoes(e.target.value)} required rows={2} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" placeholder="Deveres legais, assistência técnica..." />
            </div>

            {/* SELETORES DE COMPLIANCE JURÍDICO */}
            <div className={`flex flex-col p-4 border rounded-md transition-colors ${modoPequeno ? 'bg-yellow-50/50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
              <label className="text-sm font-bold text-slate-800 mb-2">Modelo de Gestão e Fiscalização</label>
              <select required value={modeloGestao} onChange={(e) => setModeloGestao(e.target.value)} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="" disabled>Selecione...</option>
                <option value="Fiscalização direta pelo servidor designado através de portaria, com ateste em nota fiscal após conferência quantitativa e qualitativa.">Fiscalização direta por servidor (Simplificado)</option>
                <option value="Fiscalização por comissão de recebimento (acima de R$ 300.000,00), com termo de recebimento provisório e definitivo.">Comissão de Recebimento (Complexo)</option>
              </select>

              <label className="text-sm font-bold text-slate-800 mt-4 mb-2">Sanções Administrativas</label>
              <select required value={sancoes} onChange={(e) => setSancoes(e.target.value)} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="" disabled>Selecione...</option>
                <option value="Apenas advertência e multa moratória leve, aplicável a objetos de pronta entrega e baixo risco.">Padrão LEVE (Pronta Entrega)</option>
                <option value="Advertência, Multa de mora (0,5% ao dia de atraso), Multa compensatória (até 10%) e Impedimento de licitar conforme gravidade.">Padrão RIGOROSO (Multas e Impedimento)</option>
              </select>

              <label className="text-sm font-bold text-slate-800 mt-4 mb-2">Critérios de Pagamento</label>
              <input value={pagamento} onChange={(e) => setPagamento(e.target.value)} required className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: Em até 30 dias..." />
            </div>
          </div>

          <div className="lg:col-span-2 mt-4">
            <button type="submit" disabled={loading} className="w-full bg-green-800 text-white font-bold py-4 rounded-xl hover:bg-green-700 disabled:bg-slate-400 transition-all shadow-md text-lg">
              {loading ? 'Consolidando Cláusulas...' : 'Assinar e Gerar TR Auditável'}
            </button>
          </div>
        </form>

        {erro && (<div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap shadow-sm"><strong>Erro:</strong> {erro}</div>)}

        {resultado && (
          <div className="mt-10 p-8 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-green-200 pb-4">
              <h2 className="text-xl font-bold text-green-900">Termo de Referência Consolidado</h2>
              <button type="button" onClick={exportarParaWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2">📄 Exportar Word</button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-green-100 text-justify font-serif">{resultado.texto_oficial}</div>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-green-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Termo de Aprovação - TR</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">O sistema organizou os blocos obrigatórios. A definição técnica do objeto e a restrição de competitividade são de sua responsabilidade jurídica.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md">Cancelar</button>
              <button onClick={executarEnvioBlindado} disabled={!termoAceito} className="px-6 py-2 bg-green-700 text-white font-bold rounded-md hover:bg-green-800 shadow-sm">Aprovar TR Definitivo</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}