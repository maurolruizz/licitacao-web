'use client';

import { useState } from 'react';
import { licitacaoService } from '../services/licitacaoService';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  // DECLARAÇÃO DE MEMÓRIA (Isso resolve a tela vermelha "is not defined")
  const [origem, setOrigem] = useState('');
  const [impacto, setImpacto] = useState('');
  const [pca, setPca] = useState('Sim');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);
  const [dadosFormulario, setDadosFormulario] = useState<FormData | null>(null);

  const prepararEnvio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDadosFormulario(new FormData(e.currentTarget));
    setModalAberto(true);
  };

  const executarEnvioBlindado = async () => {
    if (!dadosFormulario) return;
    
    setModalAberto(false);
    setLoading(true);
    setErro(null);

    // BLINDAGEM ANTI-422: Empacotamento exato para o Python
    const payload = {
      setor_requisitante: (dadosFormulario.get('setor') || '').toString(),
      objeto_da_compra: (dadosFormulario.get('objeto') || '').toString(),
      quantidade_estimada: Number(dadosFormulario.get('quantidade')) || 1,
      origem_necessidade: origem || 'Não selecionada',
      impacto_institucional: impacto || 'Não selecionado',
      previsao_pca: pca
    };

    try {
      const data = await licitacaoService.gerarDFD(payload);
      setResultado(data);
    } catch (err: any) {
      setErro(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const exportarParaWord = () => {
    if (!resultado) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>DFD Oficial</title></head><body>";
    const footer = "</body></html>";
    const htmlText = resultado.texto_oficial.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 11pt; text-align: justify; line-height: 1.5; margin-bottom: 6px;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    fileDownload.href = url;
    fileDownload.download = 'DFD_Oficial_Auditavel.doc';
    document.body.appendChild(fileDownload);
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 relative">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-slate-200">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider">
          MÓDULO DE GOVERNANÇA E COMPLIANCE - LEI 14.133/2021
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-200 items-center">
          <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md shadow-sm">1. Módulo DFD</span>
          <Link href="/etp" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">2. Módulo ETP →</Link>
          <Link href="/tr" className="text-slate-600 hover:text-green-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">3. Módulo TR →</Link>
          <Link href="/pesquisa" className="text-slate-600 hover:text-indigo-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">4. Pesquisa PNCP →</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Fase 1: Formalização de Demanda (DFD)</h1>
          <p className="text-slate-500 text-sm">Estruturação guiada para blindagem institucional.</p>
        </header>
        
        <form onSubmit={prepararEnvio} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Setor Requisitante</label>
              <input name="setor" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Secretaria de Saúde" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Quantidade Estimada</label>
              <input name="quantidade" type="number" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Objeto da Demanda</label>
            <input name="objeto" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Aquisição de Veículos Utilitários" />
          </div>

          {/* NOVOS CAMPOS ESTRUTURADOS */}
          <div className="flex flex-col p-5 bg-blue-50 border border-blue-200 rounded-md">
            <label className="text-sm font-bold text-slate-800 mb-3">Origem Técnica da Necessidade</label>
            <select 
              required 
              value={origem} 
              onChange={(e) => setOrigem(e.target.value)}
              className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Selecione o motivo fático...</option>
              <option value="Obsolescência tecnológica dos equipamentos atuais">Obsolescência dos equipamentos atuais</option>
              <option value="Aumento de demanda operacional do setor">Aumento de demanda operacional</option>
              <option value="Necessidade de adequação a nova exigência legal ou normativa">Adequação a nova exigência legal/normativa</option>
              <option value="Falhas frequentes e alto custo de manutenção do parque atual">Alto custo de manutenção do parque atual</option>
            </select>

            <label className="text-sm font-bold text-slate-800 mb-3 mt-4">Risco e Impacto Institucional da Não Contratação</label>
            <select 
              required 
              value={impacto} 
              onChange={(e) => setImpacto(e.target.value)}
              className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Selecione o principal risco...</option>
              <option value="Paralisação ou prejuízo direto ao atendimento ao cidadão">Prejuízo ao atendimento ao cidadão</option>
              <option value="Risco à segurança da informação e integridade dos dados governamentais">Risco à segurança da informação</option>
              <option value="Redução severa da eficiência e produtividade dos servidores">Redução de eficiência dos servidores</option>
              <option value="Descumprimento de metas estabelecidas no planejamento estratégico">Descumprimento de metas estratégicas</option>
            </select>
          </div>

          <div className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-md">
            <label className="text-sm font-bold text-slate-800 mb-2">A Contratação está prevista no PCA?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="pca" value="Sim" checked={pca === 'Sim'} onChange={(e) => setPca(e.target.value)} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Sim, prevista</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="pca" value="Não" checked={pca === 'Não'} onChange={(e) => setPca(e.target.value)} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Não (Requererá justificativa de exceção)</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-md">
            {loading ? 'Aplicando Motor de Governança...' : 'Gerar DFD Auditável'}
          </button>
        </form>

        {erro && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap"><strong>Erro no Motor:</strong> {erro}</div>}

        {resultado && (
          <div className="mt-10 p-6 bg-slate-50 rounded-md border border-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-4">
              <h2 className="text-lg font-bold">DFD Estruturado e Blindado</h2>
              <button onClick={exportarParaWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition-colors flex items-center gap-2">
                📄 Exportar Documento Legal
              </button>
            </div>
            <div className="bg-white p-6 rounded shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-slate-200 font-serif">
              {resultado.texto_oficial}
            </div>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selo de Autoria e Responsabilidade</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">
              O sistema traduziu as suas seleções fáticas para a linguagem jurídica formal. Ao confirmar, um Hash imutável será gerado no documento para fins de auditoria do TCE/TCU.
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
                  Declaro que as informações selecionadas condizem com a realidade administrativa e assumo a responsabilidade técnica perante o Art. 11 da Lei 14.133/2021.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
              <button onClick={executarEnvioBlindado} disabled={!termoAceito} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm">Confirmar e Assinar Eletronicamente</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}