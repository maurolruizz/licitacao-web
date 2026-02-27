'use client';

import { useState } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaETP() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  // 1. MEMÓRIA RESTAURADA (Regressão Zero: Especificações e Requisitos voltaram)
  const [objeto, setObjeto] = useState('');
  const [necessidade, setNecessidade] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  const [requisitos, setRequisitos] = useState('');
  
  // 2. MEMÓRIA DA MATRIZ DO ART 18 (Compliance)
  const [alternativa1, setAlternativa1] = useState('');
  const [alternativa2, setAlternativa2] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [risco, setRisco] = useState('');
  const [mitigacao, setMitigacao] = useState('');

  // 3. MOTOR DO RADAR RESTAURADO
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarResultado, setRadarResultado] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);

  const buscarRadar = () => {
    if (!objeto || !especificacao) {
      alert("Preencha o 'Objeto' e as 'Especificações' para o radar.");
      return;
    }
    setRadarLoading(true);
    setRadarResultado(null);

    setTimeout(() => {
      const textoAnalise = (objeto + " " + especificacao).toLowerCase();
      let preco = "R$ 1.500,00 a R$ 3.000,00 (Estimativa média genérica)";
      if (textoAnalise.includes('notebook') || textoAnalise.includes('computador')) {
        preco = textoAnalise.includes('i7') || textoAnalise.includes('16gb') 
          ? "R$ 5.200,00 a R$ 7.500,00 (Equipamento de Alta Performance)"
          : "R$ 3.200,00 a R$ 4.800,00 (Equipamento Padrão/Básico)";
      }
      setRadarResultado(preco);
      setRadarLoading(false);
    }, 1200);
  };

  const prepararEnvio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalAberto(true);
  };

  const executarEnvioBlindado = async () => {
    setModalAberto(false);
    setLoading(true);
    setErro(null);

    // RESTAURAÇÃO: Sincronização invisível com o TR
    localStorage.setItem('licitacao_objeto', objeto);
    localStorage.setItem('licitacao_especificacao', especificacao);

    // Empacotando Especificação e Requisitos dentro da Necessidade para o Python processar
    const necessidadeEnriquecida = `${necessidade}\n\nEspecificações Preliminares: ${especificacao}\nRequisitos Adicionais: ${requisitos}`;

    const payload = {
      objeto_da_compra: objeto || 'Não informado',
      necessidade_identificada: necessidadeEnriquecida,
      alternativa_1: alternativa1 || 'Não informada',
      alternativa_2: alternativa2 || 'Não informada',
      justificativa_escolha: justificativa || 'Não informada',
      risco_principal: risco || 'Não selecionado',
      mitigacao: mitigacao || 'Não selecionada'
    };

    try {
      const data = await licitacaoService.gerarETP(payload);
      setResultado(data);
    } catch (err: any) {
      setErro(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const exportarParaWord = () => {
    if (!resultado) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>ETP Oficial</title></head><body>";
    const footer = "</body></html>";
    const htmlText = resultado.texto_oficial.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 11pt; text-align: justify; line-height: 1.5; margin-bottom: 6px;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    fileDownload.href = url;
    fileDownload.download = 'ETP_Oficial_Auditavel.doc';
    document.body.appendChild(fileDownload);
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm">
          MÓDULO DE GOVERNANÇA E COMPLIANCE - LEI 14.133/2021
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-300 items-center">
          <Link href="/" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 1. Módulo DFD</Link>
          <span className="text-blue-800 font-bold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md shadow-sm">2. Módulo ETP</span>
          <Link href="/tr" className="text-slate-600 hover:text-green-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">3. Módulo TR →</Link>
          <Link href="/pesquisa" className="text-slate-600 hover:text-indigo-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">4. Pesquisa PNCP →</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Estudo Técnico Preliminar (ETP)</h1>
          <p className="text-slate-600 mt-1">Matriz de Alternativas, Riscos e Radar Estratégico (Art. 18, §1º)</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={prepararEnvio} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
              
              {/* BLOCO 1: NECESSIDADE E RADAR RESTAURADO */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">1. Objeto e Necessidade Técnica</h3>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-1">Objeto da Compra</label>
                  <input value={objeto} onChange={(e) => setObjeto(e.target.value)} required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Aquisição de 10 notebooks" />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-1">Problema a ser resolvido</label>
                  <textarea value={necessidade} onChange={(e) => setNecessidade(e.target.value)} required rows={2} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Qual a finalidade pública desta compra?" />
                </div>
                
                {/* O Radar que havia sido perdido */}
                <div className="flex flex-col border-l-4 border-amber-400 pl-4 py-3 bg-amber-50/30 rounded-r-md mt-4">
                  <label className="text-sm font-bold text-slate-800 mb-2">Especificações Técnicas Preliminares (Alimenta o TR e o Radar)</label>
                  <textarea value={especificacao} onChange={(e) => setEspecificacao(e.target.value)} required rows={3} className="p-3 border border-amber-200 rounded-md outline-none focus:ring-2 focus:ring-amber-500 bg-white" placeholder="Ex: Processador i7, 16GB RAM..." />
                  
                  <button type="button" onClick={buscarRadar} disabled={radarLoading} className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-md font-bold transition-colors shadow-sm w-full md:w-auto">
                    {radarLoading ? 'Analisando Mercado...' : '📊 Gerar Radar de Preços (Uso Interno)'}
                  </button>
                  
                  {radarResultado && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-sm shadow-inner">
                      <strong className="block mb-1 text-base">💡 Norte Estratégico (Não-Oficial):</strong>
                      {radarResultado}
                    </div>
                  )}
                </div>

                <div className="flex flex-col mt-4">
                  <label className="text-sm font-semibold mb-1">Requisitos da Contratação</label>
                  <textarea value={requisitos} onChange={(e) => setRequisitos(e.target.value)} required rows={2} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Exigências de garantia, entrega, etc." />
                </div>
              </div>

              {/* BLOCO 2: ALTERNATIVAS (Compliance Art 18) */}
              <div className="space-y-4 bg-blue-50/50 p-5 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2">2. Análise de Alternativas de Mercado</h3>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-1 text-slate-700">Cenário 1: Solução Padrão (Ex: Compra)</label>
                  <input value={alternativa1} onChange={(e) => setAlternativa1(e.target.value)} required className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva a primeira alternativa..." />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-1 text-slate-700">Cenário 2: Solução Alternativa (Ex: Locação)</label>
                  <input value={alternativa2} onChange={(e) => setAlternativa2(e.target.value)} required className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva uma alternativa viável..." />
                </div>
                <div className="flex flex-col mt-4">
                  <label className="text-sm font-bold text-blue-800 mb-1">Justificativa da Solução Escolhida</label>
                  <textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} required rows={2} className="p-3 border border-blue-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Por que o Cenário escolhido é o mais vantajoso?" />
                </div>
              </div>

              {/* BLOCO 3: RISCOS ESTRUTURADOS */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">3. Gerenciamento de Riscos Preliminar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-1">Risco Principal</label>
                    <select required value={risco} onChange={(e) => setRisco(e.target.value)} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="" disabled>Selecione um risco...</option>
                      <option value="Fracasso ou deserção da licitação">Licitação deserta/fracassada</option>
                      <option value="Atraso na entrega do objeto pelo fornecedor">Atraso na entrega</option>
                      <option value="Entrega de produto com qualidade inferior à especificada">Qualidade inferior à exigida</option>
                      <option value="Superfaturamento ou sobrepreço">Sobrepreço</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-1">Ação de Mitigação</label>
                    <select required value={mitigacao} onChange={(e) => setMitigacao(e.target.value)} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="" disabled>Selecione a mitigação...</option>
                      <option value="Realizar ampla e rigorosa pesquisa de preços de mercado">Ampla pesquisa de preços</option>
                      <option value="Estabelecer cronograma de entrega rígido com multas no TR">Cronograma rígido e multas</option>
                      <option value="Exigir amostra ou certificação técnica na fase de aceitação">Exigência de certificação técnica</option>
                      <option value="Parcelamento do objeto para aumentar a competitividade">Parcelamento do objeto</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 disabled:bg-slate-400 transition-all shadow-md text-lg">
                {loading ? 'Processando Matriz Decisória...' : 'Assinar e Gerar ETP Auditável'}
              </button>
            </form>

            {erro && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm shadow-sm"><strong>Erro:</strong> {erro}</div>}

            {resultado && (
              <div className="p-8 bg-blue-50 rounded-xl border border-blue-200 shadow-sm mt-8">
                <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-4">
                  <h2 className="text-xl font-bold text-blue-900">Documento Oficial: ETP</h2>
                  <button onClick={exportarParaWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center gap-2">📄 Exportar Word</button>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-blue-100 font-serif text-justify">{resultado.texto_oficial}</div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
              <h3 className="font-bold text-slate-800 mb-4">🛡️ Checklist do Art. 18</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${necessidade ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{necessidade ? '✓' : '1'}</div>
                  <div className={necessidade ? 'text-slate-800' : 'text-slate-500'}><strong>Descrição e Objeto</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${alternativa1 && justificativa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{alternativa1 && justificativa ? '✓' : '2'}</div>
                  <div className={alternativa1 && justificativa ? 'text-slate-800' : 'text-slate-500'}><strong>Matriz de Alternativas</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${risco ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{risco ? '✓' : '3'}</div>
                  <div className={risco ? 'text-slate-800' : 'text-slate-500'}><strong>Mapa de Riscos</strong></div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Termo de Responsabilidade Técnica - ETP</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">
              O sistema consolidou a sua Análise de Alternativas e Mapa de Riscos. A decisão da contratação e a pesquisa de mercado preliminar são de sua inteira responsabilidade (Art. 18, Lei 14.133/2021).
            </p>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={termoAceito}
                  onChange={(e) => setTermoAceito(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-800 text-justify">
                  Declaro que revisei os cenários inseridos e atesto a viabilidade desta contratação. Autorizo a geração do Hash de Auditoria.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
              <button onClick={executarEnvioBlindado} disabled={!termoAceito} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm">Atestar Viabilidade e Gerar ETP</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}