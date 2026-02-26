'use client';

import { useState } from 'react';
import { licitacaoService } from '../services/licitacaoService';
import Link from 'next/link';

export default function Home() {
  // Estados do Formulário Original
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  // NOVOS ESTADOS: Escudo Jurídico e Governança
  const [motivacaoHumana, setMotivacaoHumana] = useState('');
  const [pca, setPca] = useState('Sim');
  
  // ESTADOS DO MODAL DE RESPONSABILIZAÇÃO
  const [modalAberto, setModalAberto] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);
  const [dadosFormulario, setDadosFormulario] = useState<FormData | null>(null);

  // PASSO 1: Abre o Modal em vez de enviar direto
  const prepararEnvio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDadosFormulario(new FormData(e.currentTarget));
    setModalAberto(true);
  };

  // PASSO 2: O Envio Real após a Assinatura (Regressão Zero API)
  const executarEnvioBlindado = async () => {
    if (!dadosFormulario) return;
    
    setModalAberto(false);
    setLoading(true);
    setErro(null);

    // HACK DE REGRESSÃO ZERO: Empacotando os novos campos na variável que o Python já aceita
    const justificativaEnriquecida = `
      ATENÇÃO IA - MOTIVAÇÃO FÁTICA DO GESTOR (NÃO ALTERAR O NÚCLEO DESTE TEXTO): "${motivacaoHumana}".
      STATUS PCA: A contratação está prevista no PCA? ${pca}.
      INFORMAÇÕES ADICIONAIS: ${dadosFormulario.get('justificativa')}
    `;

    const payload = {
      setor_requisitante: dadosFormulario.get('setor'),
      objeto_da_compra: dadosFormulario.get('objeto'),
      justificativa_precaria: justificativaEnriquecida,
      quantidade_estimada: Number(dadosFormulario.get('quantidade')),
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
    const htmlText = resultado.texto_oficial.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'DFD_Oficial_GovTech.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 relative">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-slate-200">
        
        {/* CABEÇALHO DE GOVERNANÇA */}
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider">
          SISTEMA DE APOIO À DECISÃO - LEI 14.133/2021
        </div>

        <nav className="mb-6 text-sm font-medium space-x-4 border-b pb-4">
          <span className="text-blue-600 font-bold">Módulo DFD</span>
          <Link href="/etp" className="text-slate-500 hover:text-blue-600 transition-colors">ETP →</Link>
          <Link href="/tr" className="text-slate-500 hover:text-green-600 transition-colors">TR →</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Fase 1: Formalização de Demanda (DFD)</h1>
          <p className="text-slate-500 text-sm">Preenchimento Híbrido: Gestor + Inteligência Artificial</p>
        </header>
        
        <form onSubmit={prepararEnvio} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Setor Requisitante</label>
              <input name="setor" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Secretaria de TI" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Quantidade Estimada</label>
              <input name="quantidade" type="number" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Objeto da Demanda</label>
            <input name="objeto" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Notebooks de alto desempenho" />
          </div>

          {/* NOVA ÁREA DE BLINDAGEM: PCA */}
          <div className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-md">
            <label className="text-sm font-bold text-slate-800 mb-2">A Contratação está prevista no PCA (Plano de Contratações Anual)?</label>
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

          {/* NOVA ÁREA DE BLINDAGEM: MOTIVAÇÃO HUMANA (ART. 11) */}
          <div className="flex flex-col border-l-4 border-blue-600 pl-4 py-2">
            <label className="text-sm font-bold text-slate-800 mb-1">Motivação Administrativa (Art. 11)</label>
            <p className="text-xs text-slate-500 mb-2">Descreva com suas palavras o motivo fático desta compra. A IA usará este texto como núcleo inalterável.</p>
            <textarea 
              value={motivacaoHumana} 
              onChange={(e) => setMotivacaoHumana(e.target.value)}
              required 
              rows={3} 
              className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30" 
              placeholder="Ex: A sala de operação sofreu danos e os equipamentos atuais queimaram..." 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Informações Adicionais para a IA</label>
            <textarea name="justificativa" rows={2} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalhes complementares (opcional)..." />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-md">
            {loading ? 'Consolidando Documento...' : 'Gerar DFD Oficial'}
          </button>
        </form>

        {erro && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap"><strong>Erro no Motor:</strong> {erro}</div>}

        {resultado && (
          <div className="mt-10 p-6 bg-slate-50 rounded-md border border-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-4">
              <h2 className="text-lg font-bold">DFD Consolidado</h2>
              <button onClick={exportarParaWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition-colors flex items-center gap-2">
                📄 Assinar e Exportar
              </button>
            </div>
            <div className="bg-white p-6 rounded shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-slate-200">{resultado.texto_oficial}</div>
          </div>
        )}
      </div>

      {/* MODAL DE RESPONSABILIDADE JURÍDICA (RISCO ZERO) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Termo de Copilotagem</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">
              O sistema atua exclusivamente como assistente de redação e formatação baseada em Inteligência Artificial. A decisão administrativa, a veracidade dos fatos e a pesquisa de mercado são de sua inteira responsabilidade.
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
                  Declaro sob as penas da Lei 14.133/2021 que li, conferi e assumo a autoria técnica das informações que serão geradas neste documento.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executarEnvioBlindado}
                disabled={!termoAceito}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm"
              >
                Confirmar e Gerar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}