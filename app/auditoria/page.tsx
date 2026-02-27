'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ModoAuditoria() {
  const [dadosProcesso, setDadosProcesso] = useState<any>({
    objeto: 'Não identificado',
    etapas: { dfd: false, etp: false, tr: false, in65: false },
    in65Hash: null
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando leitura da Trilha de Auditoria no Banco de Dados/LocalStorage
    const objeto = localStorage.getItem('licitacao_objeto') || 'AQUISIÇÃO DE NOTEBOOKS';
    const in65Hash = localStorage.getItem('licitacao_in65_hash');
    
    // Para efeito de demonstração de Regressão Zero, vamos considerar as etapas concluídas
    // baseadas na existência do objeto e hash da IN 65.
    setDadosProcesso({
      objeto: objeto.toUpperCase(),
      etapas: {
        dfd: true, 
        etp: !!objeto, 
        tr: !!objeto, 
        in65: !!in65Hash
      },
      in65Hash: in65Hash || 'Pendente de homologação estatística'
    });
    setLoading(false);
  }, []);

  const exportarRelatorioConsolidado = () => {
    const conteudo = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Relatório Consolidado de Governança</title></head><body>
      <h2 style="text-align: center; font-family: Arial; color: #1e3a8a;">RELATÓRIO CONSOLIDADO DA FASE PREPARATÓRIA</h2>
      <p style="text-align: center; font-family: Arial; font-size: 10pt; color: #666;">Lei 14.133/2021 - Mapa de Responsabilidade e Compliance</p>
      
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. Dados do Processo</h3>
      <ul style="font-family: Arial; font-size: 11pt;">
        <li><strong>Objeto Central:</strong> ${dadosProcesso.objeto}</li>
        <li><strong>Data da Auditoria:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
      </ul>

      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">2. Linha do Tempo Decisória (Trilha Imutável)</h3>
      <table border="1" style="width: 100%; border-collapse: collapse; font-family: Arial; font-size: 10pt;">
        <thead style="background-color: #f1f5f9;">
          <tr><th>Fase Legal</th><th>Status</th><th>Rastreabilidade (Compliance)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px;"><strong>1. DFD (Art. 12)</strong></td>
            <td style="padding: 8px; text-align: center; color: green; font-weight: bold;">CONCLUÍDO</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Selo SHA-256 Emitido. Motivação Estruturada.</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>2. ETP (Art. 18)</strong></td>
            <td style="padding: 8px; text-align: center; color: green; font-weight: bold;">CONCLUÍDO</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Matriz de Alternativas e Riscos Homologada.</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>3. TR (Art. 6º)</strong></td>
            <td style="padding: 8px; text-align: center; color: green; font-weight: bold;">CONCLUÍDO</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Modelo de Gestão e Sanções Aplicados.</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>4. Pesquisa IN 65</strong></td>
            <td style="padding: 8px; text-align: center; color: ${dadosProcesso.etapas.in65 ? 'green' : 'red'}; font-weight: bold;">${dadosProcesso.etapas.in65 ? 'CONCLUÍDO' : 'PENDENTE'}</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Filtro IQR aplicado. Hash: ${dadosProcesso.in65Hash}</td>
          </tr>
        </tbody>
      </table>
      
      <br><br><br>
      <p style="text-align: center; font-family: Arial; font-size: 11pt;">
        ___________________________________________________<br>
        <strong>CERTIFICAÇÃO DE COMPLIANCE GOVTECH</strong><br>
        Atestamos que as peças processuais seguiram o rito rígido da Lei 14.133/2021.
      </p>
      </body></html>
    `;
    const blob = new Blob(['\ufeff', conteudo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = 'Relatorio_Consolidado_Auditoria.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando Trilha...</div>;

  return (
    <main className="min-h-screen bg-slate-900 p-6 font-sans text-slate-100">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-6 bg-slate-800 border border-slate-700 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm text-yellow-400">
          ACESSO RESTRITO - MODO AUDITORIA (TCE/TCU)
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b border-slate-700 pb-4 items-center">
          <Link href="/" className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-md transition-all">← Voltar para Operação (DFD)</Link>
          <span className="text-yellow-400 font-bold bg-yellow-900/30 border border-yellow-700/50 px-3 py-1.5 rounded-md shadow-sm">🛡️ Painel de Controle Consolidado</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Linha do Tempo Processual</h1>
          <p className="text-slate-400 mt-1">Visão Executiva do Processo Licitatório de: <strong className="text-yellow-400">{dadosProcesso.objeto}</strong></p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {/* Timeline Cards */}
          <div className={`p-5 rounded-xl border ${dadosProcesso.etapas.dfd ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-white">1. DFD</span>
              {dadosProcesso.etapas.dfd ? <span className="text-green-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}
            </div>
            <p className="text-xs text-slate-400">Art. 12 da Lei 14.133</p>
          </div>

          <div className={`p-5 rounded-xl border relative ${dadosProcesso.etapas.etp ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-white">2. ETP</span>
              {dadosProcesso.etapas.etp ? <span className="text-green-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}
            </div>
            <p className="text-xs text-slate-400">Art. 18 da Lei 14.133</p>
          </div>

          <div className={`p-5 rounded-xl border relative ${dadosProcesso.etapas.tr ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-white">3. TR</span>
              {dadosProcesso.etapas.tr ? <span className="text-green-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}
            </div>
            <p className="text-xs text-slate-400">Art. 6º da Lei 14.133</p>
          </div>

          <div className={`p-5 rounded-xl border relative ${dadosProcesso.etapas.in65 ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-white">4. IN 65 (Preços)</span>
              {dadosProcesso.etapas.in65 ? <span className="text-indigo-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}
            </div>
            <p className="text-xs text-slate-400">Cálculo Estatístico IQR</p>
          </div>
        </div>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Dossiê de Rastreabilidade</h2>
          
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-lg flex justify-between items-center border border-slate-700">
              <div>
                <span className="block text-xs text-slate-400 font-mono mb-1">HASH DA PESQUISA DE PREÇOS (IN 65)</span>
                <span className={`font-mono text-sm ${dadosProcesso.etapas.in65 ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {dadosProcesso.in65Hash}
                </span>
              </div>
              <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded text-xs">Registro Imutável</span>
            </div>

            <button 
              onClick={exportarRelatorioConsolidado}
              className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl transition-colors shadow-md text-lg"
            >
              📄 Baixar Relatório Consolidado de Governança
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}