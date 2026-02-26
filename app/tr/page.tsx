'use client';

import { useState, useEffect } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaTR() {
  const [objeto, setObjeto] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  
  useEffect(() => {
    const objetoSalvo = localStorage.getItem('licitacao_objeto');
    const especificacaoSalva = localStorage.getItem('licitacao_especificacao');
    
    if (objetoSalvo) setObjeto(objetoSalvo);
    if (especificacaoSalva) setEspecificacao(especificacaoSalva);
  }, []);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      objeto_da_compra: objeto,
      justificativa_contratacao: formData.get('justificativa'),
      especificacao_tecnica: especificacao,
      obrigacoes_contratada: formData.get('obrigacoes'),
      prazo_e_local_entrega: formData.get('prazo_local'),
      criterios_de_pagamento: formData.get('pagamento'),
    };

    try {
      const data = await licitacaoService.gerarTR(payload);
      setResultado(data);
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
    const htmlText = resultado.texto_oficial.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 12pt; text-align: justify; line-height: 1.5;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'Termo_de_Referencia_Oficial.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-slate-200">
        
        <nav className="mb-6 text-sm font-medium space-x-4 border-b pb-4">
          <Link href="/" className="text-slate-500 hover:text-green-600 transition-colors">← Voltar para DFD</Link>
          <Link href="/etp" className="text-slate-500 hover:text-green-600 transition-colors">← Voltar para ETP</Link>
          <span className="text-green-700 font-bold">Módulo TR</span>
        </nav>
        
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-green-900">Fase 3: Termo de Referência (TR)</h1>
          <p className="text-slate-500 text-sm">Regras de contratação com Auto-Importação de Dados do ETP</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Objeto da Contratação</label>
              <input 
                value={objeto} 
                onChange={(e) => setObjeto(e.target.value)}
                required 
                className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500 bg-green-50 font-medium" 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Critérios de Pagamento</label>
              <input 
                name="pagamento" 
                required 
                className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" 
                placeholder="Ex: Em até 30 dias após ateste" 
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1 flex items-center gap-2">
              Especificações Técnicas Mínimas 
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider shadow-sm">
                Sincronizado do ETP
              </span>
            </label>
            <textarea 
              value={especificacao} 
              onChange={(e) => setEspecificacao(e.target.value)}
              required 
              rows={4} 
              className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500 bg-green-50 font-medium leading-relaxed" 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Prazo e Local de Entrega</label>
            <input 
              name="prazo_local" 
              required 
              className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" 
              placeholder="Ex: 15 dias na Sede da Prefeitura" 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Justificativa da Contratação</label>
            <textarea 
              name="justificativa" 
              required 
              rows={3} 
              className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" 
              placeholder="Qual o interesse público nesta compra?" 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Obrigações da Contratada (Fornecedor)</label>
            <textarea 
              name="obrigacoes" 
              required 
              rows={3} 
              className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-green-500" 
              placeholder="Deveres legais, garantias e assistência..." 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-green-800 text-white font-bold py-4 rounded-md hover:bg-green-700 disabled:bg-slate-400 transition-all shadow-md text-lg"
          >
            {loading ? 'Redigindo Termo de Referência na IA...' : 'Gerar TR Oficial'}
          </button>
        </form>

        {erro && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap shadow-sm">
            <strong>Validação do Motor Jurídico:</strong> {erro}
          </div>
        )}

        {resultado && (
          <div className="mt-10 p-8 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-green-200 pb-4">
              <h2 className="text-xl font-bold text-green-900">Termo de Referência Consolidado</h2>
              <button 
                type="button" 
                onClick={exportarParaWord} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2"
              >
                📄 Exportar para Word
              </button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-green-100 text-justify font-serif">
              {resultado.texto_oficial}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}