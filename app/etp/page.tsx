'use client';

import { useState } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaETP() {
  const [objeto, setObjeto] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  const [requisitos, setRequisitos] = useState('');
  
  // NOVOS ESTADOS: Escudo Jurídico
  const [motivacaoHumana, setMotivacaoHumana] = useState('');
  const [pca, setPca] = useState('Sim');

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [radarLoading, setRadarLoading] = useState(false);
  const [radarResultado, setRadarResultado] = useState<string | null>(null);
  const [riscos, setRiscos] = useState<any[]>([]);

  // ESTADOS DO MODAL
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

  const gerarMapaDeRiscos = (obj: string) => {
    const objLower = obj.toLowerCase();
    const mapa = [
      { risco: "Insucesso na licitação (Deserta/Fracassada)", mitigacao: "Ampla pesquisa de mercado." },
      { risco: "Atraso na entrega pelo fornecedor", mitigacao: "Estabelecer multas claras no TR." }
    ];
    if (objLower.includes('notebook') || objLower.includes('tecnologia')) {
      mapa.push({ risco: "Obsolescência tecnológica rápida", mitigacao: "Exigir equipamentos de gerações recentes." });
    }
    setRiscos(mapa);
  };

  const prepararEnvio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalAberto(true);
  };

  const executarEnvioBlindado = async () => {
    setModalAberto(false);
    setLoading(true);
    setErro(null);
    setResultado(null);
    setRiscos([]);

    // Single Source of Truth para o TR
    localStorage.setItem('licitacao_objeto', objeto);
    localStorage.setItem('licitacao_especificacao', especificacao);

    // HACK REGRESSÃO ZERO: Mesclando os dados fáticos do humano para a IA
    const necessidadeEnriquecida = `
      ATENÇÃO IA - MOTIVAÇÃO FÁTICA DO GESTOR (ART 11): "${motivacaoHumana}".
      STATUS PCA: Previsto no PCA? ${pca}.
      (Não altere a motivação acima, apenas a incorpore ao texto oficial).
    `;

    const payload = {
      objeto_da_compra: objeto,
      necessidade_identificada: necessidadeEnriquecida,
      requisitos_da_contratacao: requisitos + `\n\nEspecificações Preliminares: ${especificacao}`,
    };

    try {
      const data = await licitacaoService.gerarETP(payload);
      setResultado(data);
      gerarMapaDeRiscos(objeto);
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
    let textoLimpo = resultado.texto_oficial.replace(/\*\*/g, '').replace(/### /g, '').replace(/## /g, '');
    const htmlText = textoLimpo.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'ETP_Oficial.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const step1Valid = motivacaoHumana.length > 5;
  const step2Valid = objeto.length > 5 && especificacao.length > 5;
  const step3Valid = resultado !== null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm">
          SISTEMA DE APOIO À DECISÃO E GOVERNANÇA - LEI 14.133/2021
        </div>

        <nav className="mb-6 text-sm font-medium space-x-4 border-b pb-4 border-slate-300">
          <Link href="/" className="text-slate-500 hover:text-blue-600 transition-colors">← Voltar para DFD</Link>
          <span className="text-blue-600 font-bold">Módulo ETP (Assistente Estratégico)</span>
          <Link href="/tr" className="text-slate-500 hover:text-green-600 transition-colors">Avançar para TR →</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Estudo Técnico Preliminar (ETP)</h1>
          <p className="text-slate-600 mt-1">Validação de Viabilidade com Registro de Motivação (Art. 11)</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={prepararEnvio} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
              
              <div className="flex flex-col border-l-4 border-blue-600 pl-4 py-2 bg-slate-50 rounded-r-md">
                <label className="text-sm font-bold text-slate-800 mb-1">1. Motivação da Contratação (Intocável pela IA)</label>
                <p className="text-xs text-slate-500 mb-2">Descreva a real necessidade. A IA não alterará o seu juízo de valor, apenas formatará o documento.</p>
                <textarea 
                  value={motivacaoHumana} 
                  onChange={(e) => setMotivacaoHumana(e.target.value)}
                  required rows={3} 
                  className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  placeholder="Ex: Atualizar o parque tecnológico para suportar os novos sistemas..." 
                />
              </div>

              <div className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-md">
                <label className="text-sm font-bold text-slate-800 mb-2">2. Previsão no PCA?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Sim" checked={pca === 'Sim'} onChange={(e) => setPca(e.target.value)} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Sim, prevista</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Não" checked={pca === 'Não'} onChange={(e) => setPca(e.target.value)} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Não prevista</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 mb-2">3. Objeto da Compra</label>
                <input value={objeto} onChange={(e) => setObjeto(e.target.value)} required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Aquisição de 10 notebooks" />
              </div>

              <div className="flex flex-col border-l-4 border-amber-400 pl-4 py-3 bg-amber-50/30 rounded-r-md">
                <label className="text-sm font-bold text-slate-800 mb-2">4. Especificações Técnicas (Para Radar de Preço)</label>
                <textarea value={especificacao} onChange={(e) => setEspecificacao(e.target.value)} required rows={3} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Ex: Processador i7, 16GB RAM..." />
                
                <button type="button" onClick={buscarRadar} disabled={radarLoading} className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-md font-bold transition-colors shadow-sm">
                  {radarLoading ? 'Analisando Mercado...' : '📊 Gerar Radar de Preços (Uso Interno)'}
                </button>
                
                {radarResultado && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-sm shadow-inner">
                    <strong className="block mb-1 text-base">💡 Norte Estratégico (Não-Oficial):</strong>
                    {radarResultado}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 mb-2">5. Requisitos da Contratação</label>
                <textarea value={requisitos} onChange={(e) => setRequisitos(e.target.value)} required rows={3} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Exigências de garantia, entrega, etc." />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 disabled:bg-slate-400 transition-all shadow-md text-lg">
                {loading ? 'Processando Validação...' : 'Assinar e Gerar ETP Consolidado'}
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">🛡️ Compliance Checklist</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step1Valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{step1Valid ? '✓' : '1'}</div>
                  <div className={step1Valid ? 'text-slate-800' : 'text-slate-500'}><strong>Motivação (Art. 11)</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step2Valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{step2Valid ? '✓' : '2'}</div>
                  <div className={step2Valid ? 'text-slate-800' : 'text-slate-500'}><strong>Objeto e Requisitos</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step3Valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{step3Valid ? '✓' : '3'}</div>
                  <div className={step3Valid ? 'text-slate-800' : 'text-slate-500'}><strong>Viabilidade (Art. 18, X)</strong></div>
                </li>
              </ul>
            </div>
            
            {riscos.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                <h3 className="font-bold text-red-800 mb-4">⚠️ Mapa de Riscos</h3>
                <div className="space-y-4">
                  {riscos.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs shadow-sm">
                      <p className="text-red-700 font-bold mb-1">Risco:</p>
                      <p className="text-slate-700 mb-3">{r.risco}</p>
                      <p className="text-green-700 font-bold mb-1">Mitigação:</p>
                      <p className="text-slate-700">{r.mitigacao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE RESPONSABILIDADE JURÍDICA */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Termo de Copilotagem - ETP</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">
              O sistema atua exclusivamente como assistente de redação e formatação. A decisão da contratação, a veracidade dos fatos da motivação e a pesquisa técnica são de sua inteira responsabilidade, conforme arts. 155 a 159 da Lei 14.133/2021.
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
                  Declaro que revisei os dados inseridos e assumo a autoria técnica e a motivação deste Estudo Técnico Preliminar.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
              <button onClick={executarEnvioBlindado} disabled={!termoAceito} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm">Assinar e Gerar ETP</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}