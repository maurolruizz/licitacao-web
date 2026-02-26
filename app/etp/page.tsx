'use client';

import { useState } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaETP() {
  // 1. Estados Controlados do Formulário
  const [objeto, setObjeto] = useState('');
  const [necessidade, setNecessidade] = useState('');
  const [requisitos, setRequisitos] = useState('');
  
  // 🎯 O NOVO CAMPO: Especificação (Apenas para o Radar e exportação para o TR)
  const [especificacao, setEspecificacao] = useState('');

  // 2. Estados de Processamento do Sistema
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  // 3. Estados das Funcionalidades Estratégicas
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarResultado, setRadarResultado] = useState<string | null>(null);
  const [riscos, setRiscos] = useState<any[]>([]);

  // 🚀 RADAR EVOLUÍDO: Avalia Objeto + Especificações
  const buscarRadar = () => {
    if (!objeto || !especificacao) {
      alert("Preencha o 'Objeto' e as 'Especificações Técnicas' para uma estimativa precisa.");
      return;
    }
    
    setRadarLoading(true);
    setRadarResultado(null);

    // Simulação de busca no Banco de Dados
    setTimeout(() => {
      const textoAnalise = (objeto + " " + especificacao).toLowerCase();
      let preco = "R$ 1.500,00 a R$ 3.000,00 (Estimativa média genérica)";
      
      if (textoAnalise.includes('notebook') || textoAnalise.includes('computador')) {
        if (textoAnalise.includes('i7') || textoAnalise.includes('ryzen 7') || textoAnalise.includes('16gb')) {
          preco = "R$ 5.200,00 a R$ 7.500,00 (Equipamento de Alta Performance)";
        } else {
          preco = "R$ 3.200,00 a R$ 4.800,00 (Equipamento Padrão/Básico)";
        }
      } else if (textoAnalise.includes('carro') || textoAnalise.includes('veículo')) {
        preco = "R$ 85.000,00 a R$ 120.000,00 (Referência: Tabela FIPE/Senatran)";
      } else if (textoAnalise.includes('software') || textoAnalise.includes('sistema')) {
        preco = "R$ 15.000,00 a R$ 45.000,00 (Licenciamento Anual - SaaS)";
      }

      setRadarResultado(preco);
      setRadarLoading(false);
    }, 1200);
  };

  // 🛡️ MAPA DE RISCOS
  const gerarMapaDeRiscos = (obj: string) => {
    const objLower = obj.toLowerCase();
    const mapa = [
      { risco: "Insucesso na licitação (Deserta/Fracassada)", mitigacao: "Ampla pesquisa de mercado e evitar exigências técnicas excessivamente restritivas no edital." },
      { risco: "Atraso na entrega pelo fornecedor", mitigacao: "Estabelecer multas claras e sanções administrativas severas no Termo de Referência." }
    ];
    if (objLower.includes('notebook') || objLower.includes('tecnologia')) {
      mapa.push({ risco: "Obsolescência tecnológica rápida", mitigacao: "Exigir apenas equipamentos de gerações recentes (ex: lançamento nos últimos 18 meses)." });
    }
    setRiscos(mapa);
  };

  // FUNÇÃO DE ENVIO AO MOTOR PYTHON
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setResultado(null);
    setRiscos([]);

    // 💾 O PULO DO GATO: Salvando silenciosamente para o TR usar depois
    localStorage.setItem('licitacao_objeto', objeto);
    localStorage.setItem('licitacao_especificacao', especificacao);

    // 🛡️ REGRESSÃO ZERO NO BACKEND: O Motor Python só receberá o que ele conhece
    const payload = {
      objeto_da_compra: objeto,
      necessidade_identificada: necessidade,
      requisitos_da_contratacao: requisitos,
    };

    try {
      const data = await licitacaoService.gerarETP(payload);
      setResultado(data);
      gerarMapaDeRiscos(objeto); // Gera o mapa de riscos apenas em caso de sucesso
    } catch (err: any) {
      setErro(err.toString());
    } finally {
      setLoading(false);
    }
  };

  // EXPORTAÇÃO NATIVA
  const exportarParaWord = () => {
    if (!resultado) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>ETP Oficial</title></head><body>";
    const footer = "</body></html>";
    let textoLimpo = resultado.texto_oficial.replace(/\*\*/g, '').replace(/### /g, '').replace(/## /g, '');
    const htmlText = textoLimpo.split('\n').map((line: string) => {
      if (!line.trim()) return '';
      return `<p style="font-family: Arial, sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5;">${line}</p>`;
    }).join('');
    const sourceHTML = header + htmlText + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'ETP_Oficial.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // CHECKLIST LOGIC
  const step1Valid = objeto.length > 5 && especificacao.length > 5;
  const step2Valid = necessidade.length > 5 && requisitos.length > 5;
  const step3Valid = resultado !== null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <nav className="mb-6 text-sm font-medium space-x-4 border-b pb-4 border-slate-300">
          <Link href="/" className="text-slate-500 hover:text-blue-600 transition-colors">← Voltar para DFD</Link>
          <span className="text-blue-600 font-bold">Módulo ETP (Assistente Estratégico)</span>
          <Link href="/tr" className="text-slate-500 hover:text-green-600 transition-colors">Avançar para TR →</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Estudo Técnico Preliminar (ETP) Inteligente</h1>
          <p className="text-slate-600 mt-1">Análise de viabilidade com Radar de Mercado baseado nas Especificações</p>
        </header>

        {/* LAYOUT GRID: Mantido intocável (Esquerda Form, Direita Assistente) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
              
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 mb-2">Objeto da Compra</label>
                <input 
                  value={objeto} 
                  onChange={(e) => setObjeto(e.target.value)} 
                  required 
                  className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="Ex: Aquisição de 10 notebooks" 
                />
              </div>

              {/* BLOCO DA ESPECIFICAÇÃO & RADAR */}
              <div className="flex flex-col border-l-4 border-amber-400 pl-4 py-3 bg-amber-50/30 rounded-r-md">
                <label className="text-sm font-bold text-slate-800 mb-2 flex justify-between items-center">
                  <span>Especificações Técnicas (Para Radar de Preço)</span>
                  <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-1 rounded">
                    Sincronizado com TR
                  </span>
                </label>
                <textarea 
                  value={especificacao} 
                  onChange={(e) => setEspecificacao(e.target.value)}
                  required 
                  rows={3} 
                  className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white" 
                  placeholder="Ex: Processador i7, 16GB RAM, SSD 512GB, Garantia de 12 meses..." 
                />
                
                <button 
                  type="button" 
                  onClick={buscarRadar} 
                  disabled={radarLoading} 
                  className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-md font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {radarLoading ? 'Analisando Mercado...' : '📊 Gerar Radar de Preços via Especificações'}
                </button>
                
                {radarResultado && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-sm shadow-inner">
                    <strong className="block mb-1 text-base">💡 Norte Estratégico de Preços:</strong>
                    {radarResultado}
                    <p className="text-xs text-amber-700 mt-2 font-mono">
                      *Aviso Legal: Valor apenas para estimativa preliminar. Não altera o texto legal do ETP.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 mb-2">Necessidade Identificada</label>
                <textarea 
                  value={necessidade} 
                  onChange={(e) => setNecessidade(e.target.value)} 
                  required 
                  rows={3} 
                  className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="Qual o problema que a administração precisa resolver?" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-800 mb-2">Requisitos da Contratação</label>
                <textarea 
                  value={requisitos} 
                  onChange={(e) => setRequisitos(e.target.value)} 
                  required 
                  rows={3} 
                  className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="Quais as exigências básicas para essa solução?" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 disabled:bg-slate-400 transition-all shadow-md text-lg"
              >
                {loading ? 'Processando Análise de Viabilidade...' : 'Gerar ETP Consolidado e Salvar Dados'}
              </button>
            </form>

            {erro && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm shadow-sm">
                <strong>Validação do Motor Jurídico:</strong> {erro}
              </div>
            )}

            {resultado && (
              <div className="p-8 bg-blue-50 rounded-xl border border-blue-200 shadow-sm mt-8">
                <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-4">
                  <h2 className="text-xl font-bold text-blue-900">Documento Oficial: ETP</h2>
                  <button 
                    type="button" 
                    onClick={exportarParaWord} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2"
                  >
                    📄 Exportar para Word
                  </button>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-blue-100 text-justify font-serif">
                  {resultado.texto_oficial}
                </div>
              </div>
            )}
          </div>

          {/* PAINEL LATERAL DE COMPLIANCE E RISCOS */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">🛡️ Compliance em Tempo Real</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step1Valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {step1Valid ? '✓' : '1'}
                  </div>
                  <div className={step1Valid ? 'text-slate-800' : 'text-slate-500'}>
                    <strong>Definição Preliminar</strong>
                    <p className="text-xs mt-1">Objeto e Especificações</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step2Valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {step2Valid ? '✓' : '2'}
                  </div>
                  <div className={step2Valid ? 'text-slate-800' : 'text-slate-500'}>
                    <strong>Requisitos Técnicos</strong>
                    <p className="text-xs mt-1">Art. 18, II e III</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step3Valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {step3Valid ? '✓' : '3'}
                  </div>
                  <div className={step3Valid ? 'text-slate-800' : 'text-slate-500'}>
                    <strong>Viabilidade</strong>
                    <p className="text-xs mt-1">Art. 18, X</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {riscos.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                <h3 className="font-bold text-red-800 mb-4">⚠️ Mapa de Riscos (Art. 18, IX)</h3>
                <div className="space-y-4">
                  {riscos.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs shadow-sm">
                      <p className="text-red-700 font-bold mb-1">Risco:</p>
                      <p className="text-slate-700 mb-3">{r.risco}</p>
                      <p className="text-green-700 font-bold mb-1">Mitigação (TR):</p>
                      <p className="text-slate-700">{r.mitigacao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}