'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaTR() {
  const router = useRouter(); // <-- INJEÇÃO DO ROTEADOR PARA REDIRECIONAMENTO AUTOMÁTICO
  
  const [objeto, setObjeto] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  
  // === INTELIGÊNCIA DO IBGE ===
  const [modoPequeno, setModoPequeno] = useState(false);
  const [isTravadoPeloIbge, setIsTravadoPeloIbge] = useState(false);

  // === INTELIGÊNCIA DO ART 40 (LOTES) ===
  const [isAgrupado, setIsAgrupado] = useState(false);
  const [itensLote, setItensLote] = useState<any[]>([]);

  useEffect(() => {
    // Leitura da Memória do ETP
    const objetoSalvo = localStorage.getItem('licitacao_objeto');
    const especificacaoSalva = localStorage.getItem('licitacao_especificacao');
    const isAgrupadoSalvo = localStorage.getItem('licitacao_is_agrupado');
    const itensLoteSalvo = localStorage.getItem('licitacao_itens_lote');
    
    if (objetoSalvo && especificacaoSalva) {
      setObjeto(objetoSalvo);
      setEspecificacao(especificacaoSalva);
      
      // Carrega os Lotes se existirem
      if (isAgrupadoSalvo === 'true' && itensLoteSalvo) {
        setIsAgrupado(true);
        setItensLote(JSON.parse(itensLoteSalvo));
      }
    } else {
      setBloqueado(true);
    }

    // Leitura do Censo IBGE salvo no DFD
    const orgaoData = localStorage.getItem('licitacao_orgao_data');
    if (orgaoData) {
      const orgao = JSON.parse(orgaoData);
      if (orgao.is_pequeno_porte) {
        setIsTravadoPeloIbge(true);
        setModoPequeno(true);
        setModeloGestao("Fiscalização direta pelo servidor designado através de portaria, com ateste em nota fiscal após conferência quantitativa e qualitativa. [NOTA DE GOVERNANÇA: Modelo simplificado aplicado automaticamente via API do Censo, atestando porte populacional aderente ao Art. 176 da Lei 14.133/21].");
        setSancoes("Apenas advertência e multa moratória leve, aplicável a objetos de pronta entrega e baixo risco.");
        setPagamento("Em até 30 dias após o ateste da nota fiscal");
      }
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

  const ativarModoPequeno = () => {
    if (isTravadoPeloIbge) return; 
    
    const ativo = !modoPequeno;
    setModoPequeno(ativo);
    
    if (ativo) {
      setModeloGestao("Fiscalização direta pelo servidor designado através de portaria, com ateste em nota fiscal após conferência quantitativa e qualitativa. [NOTA DE GOVERNANÇA: Modelo simplificado aplicado conforme porte do ente e natureza da contratação, sem afastamento de exigências legais da Lei 14.133/21].");
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
    localStorage.removeItem('licitacao_is_agrupado');
    localStorage.removeItem('licitacao_itens_lote');
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
      sancoes_aplicaveis: sancoes || 'Não selecionadas',
      is_agrupado: isAgrupado,
      itens_lote: isAgrupado ? itensLote : []
    };

    try {
      const data = await licitacaoService.gerarTR(payload);
      setResultado(data);
      localStorage.setItem('licitacao_tr_status', 'concluido');

      const processId = localStorage.getItem('licitacao_id_processo');
      const orgaoAtual = JSON.parse(localStorage.getItem('licitacao_orgao_data') || '{}');

      if (processId) {
        await licitacaoService.salvarNoBanco({
          id_processo: processId,
          cidade: orgaoAtual.cidade || 'Não Conectado',
          objeto: payload.objeto_da_compra,
          dados_completos: { fase_atual: 'TR_CONCLUIDO', payload_tr: payload },
          hash_auditoria: data.hash
        });

        // ==== O REDIRECIONAMENTO AUTOMÁTICO CORRIGIDO ====
        setTimeout(() => {
          router.push('/processos');
        }, 2000);
      }
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
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 pb-20">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm flex justify-between items-center px-6">
          <span>MÓDULO DE GOVERNANÇA E COMPLIANCE - LEI 14.133/2021</span>
          <button 
            onClick={ativarModoPequeno} 
            disabled={isTravadoPeloIbge} 
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${modoPequeno ? 'bg-yellow-500 text-yellow-900' : 'bg-slate-700 text-slate-300'} ${isTravadoPeloIbge ? 'cursor-not-allowed border-2 border-white' : ''}`}
          >
            {isTravadoPeloIbge ? '✓ AUTENTICADO: Art. 176 (Pequeno Porte)' : modoPequeno ? '🚀 Modo Município Pequeno: Ativo' : 'Ativar Modo Município Pequeno'}
          </button>
        </div>

        {/* NAVEGAÇÃO CORRIGIDA COM A ABA 4 (PNCP) */}
        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-200 items-center">
          <Link href="/" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 1. DFD</Link>
          <Link href="/etp" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 2. ETP</Link>
          <span className="text-green-800 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-md shadow-sm">3. TR</span>
          <Link href="/pncp" className="text-slate-600 hover:text-purple-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">4. PNCP (Pesquisa de Preços) →</Link>
          <Link href="/auditoria" className="ml-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-1.5 rounded-md transition-all font-bold">🛡️ Auditoria</Link>
        </nav>
        
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-green-900">Termo de Referência (TR)</h1>
            <p className="text-slate-500 text-sm mt-1">Estruturação Executiva (Art. 6º, XXIII) com Auto-Importação do ETP</p>
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
              <label className="text-sm font-semibold mb-1 flex items-center gap-2 text-green-900">Especificações Gerais (Blindado pelo ETP)</label>
              <textarea value={especificacao} readOnly rows={4} className="p-3 border border-green-200 rounded-md outline-none bg-slate-100 font-medium leading-relaxed text-slate-600 cursor-not-allowed" />
            </div>

            {isAgrupado && itensLote.length > 0 && (
              <div className="p-5 border border-blue-200 bg-blue-50/30 rounded-lg shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Art. 40 Consolidado</span>
                  <h4 className="font-bold text-blue-900 text-sm">Relação de Itens do Lote</h4>
                </div>
                <p className="text-xs text-slate-600 mb-3 text-justify">
                  Esta estrutura foi validada na Matriz de Parcelamento do ETP e não pode ser alterada diretamente no TR sem nova justificativa técnica prévia.
                </p>
                <div className="space-y-2">
                  {itensLote.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-blue-100 text-sm flex gap-3 shadow-sm">
                      <div className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded h-fit">{item.quantidade}x</div>
                      <div>
                        <strong className="block text-slate-800">{item.nome}</strong>
                        <span className="text-slate-500 text-xs">{item.especificacao}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <div className={`flex flex-col p-4 border rounded-md transition-colors ${modoPequeno ? 'bg-yellow-50/50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
              <label className="text-sm font-bold text-slate-800 mb-2">Modelo de Gestão e Fiscalização</label>
              <textarea required value={modeloGestao} onChange={(e) => setModeloGestao(e.target.value)} rows={3} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm" placeholder="Descreva o modelo de fiscalização..." />

              <label className="text-sm font-bold text-slate-800 mt-4 mb-2">Sanções Administrativas</label>
              <textarea required value={sancoes} onChange={(e) => setSancoes(e.target.value)} rows={2} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm" placeholder="Descreva as sanções..." />

              <label className="text-sm font-bold text-slate-800 mt-4 mb-2">Critérios de Pagamento</label>
              <input value={pagamento} onChange={(e) => setPagamento(e.target.value)} required className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: Em até 30 dias..." />
            </div>
          </div>

          <div className="lg:col-span-2 mt-4">
            <button type="submit" disabled={loading} className="w-full bg-green-800 text-white font-bold py-4 rounded-xl hover:bg-green-700 disabled:bg-slate-400 transition-all shadow-md text-lg">
              {loading ? 'Gerando Hash e Salvando na Nuvem...' : 'Assinar e Gerar TR Auditável'}
            </button>
          </div>
        </form>

        {erro && (<div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap shadow-sm"><strong>Erro:</strong> {erro}</div>)}

        {resultado && (
          <div className="mt-10 p-8 bg-green-50 rounded-xl border border-green-200 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-green-200 pb-4">
              <h2 className="text-xl font-bold text-green-900">Termo de Referência Consolidado</h2>
              <div className="flex gap-4">
                <button type="button" onClick={exportarParaWord} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2">
                  📄 Exportar Word
                </button>
                <button type="button" onClick={() => router.push('/pncp')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2">
                  Avançar para Etapa 4 (PNCP) ➡️
                </button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-green-100 text-justify font-serif">
              {resultado.texto_oficial}
            </div>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-green-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Assinatura de Hash Absoluto - TR</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">O sistema organizou os blocos obrigatórios mantendo a coerência com as decisões tomadas no ETP (Art. 40 e Art. 18).</p>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={termoAceito} onChange={(e) => setTermoAceito(e.target.checked)} className="mt-1 w-5 h-5 text-green-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-800 text-justify">
                  Declaro que as informações acima refletem a necessidade real do órgão e aprovo a gravação do Hash Probatório na Nuvem.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
              <button onClick={executarEnvioBlindado} disabled={!termoAceito} className="px-6 py-2 bg-green-700 text-white font-bold rounded-md hover:bg-green-800 disabled:bg-slate-300 transition-colors shadow-sm">Aprovar e Gravar Hash</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}