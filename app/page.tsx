'use client';

import { useState } from 'react';
import { licitacaoService } from '../services/licitacaoService';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      setor_requisitante: formData.get('setor'),
      objeto_da_compra: formData.get('objeto'),
      justificativa_precaria: formData.get('justificativa'),
      quantidade_estimada: Number(formData.get('quantidade')),
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
    fileDownload.download = 'DFD_Oficial.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-slate-200">
        
        <nav className="mb-6 text-sm font-medium space-x-4 border-b pb-4">
          <span className="text-blue-600 font-bold">Módulo DFD</span>
          <Link href="/etp" className="text-slate-500 hover:text-blue-600 transition-colors">ETP →</Link>
          <Link href="/tr" className="text-slate-500 hover:text-green-600 transition-colors">TR →</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Fase 1: Formalização de Demanda (DFD)</h1>
          <p className="text-slate-500 text-sm">Nascimento da compra pública (Art. 12, VII, Lei 14.133/21)</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Justificativa Preliminar</label>
            <textarea name="justificativa" required rows={4} className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva a necessidade..." />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-md">
            {loading ? 'Processando na Engine de IA...' : 'Gerar DFD Oficial'}
          </button>
        </form>

        {erro && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap"><strong>Validação do Motor Jurídico:</strong> {erro}</div>}

        {resultado && (
          <div className="mt-10 p-6 bg-slate-50 rounded-md border border-slate-300">
            <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-4">
              <h2 className="text-lg font-bold">DFD Consolidado</h2>
              <button onClick={exportarParaWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition-colors flex items-center gap-2">
                📄 Exportar para Word
              </button>
            </div>
            <div className="bg-white p-6 rounded shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-slate-200">{resultado.texto_oficial}</div>
          </div>
        )}
      </div>
    </main>
  );
}