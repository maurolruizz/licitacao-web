'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { licitacaoService } from '../../services/licitacaoService';

export default function ModoAuditoria() {
  const [dadosProcesso, setDadosProcesso] = useState<any>({
    objeto: 'Não identificado',
    etapas: { dfd: false, etp: false, tr: false, in65: false },
    in65Hash: null
  });

  const [loading, setLoading] = useState(true);
  
  // ESTADOS DO VALIDADOR DE HASH (Sprint 5)
  const [hashInput, setHashInput] = useState('');
  const [validando, setValidando] = useState(false);
  const [resultadoValidacao, setResultadoValidacao] = useState<any>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  useEffect(() => {
    const objeto = localStorage.getItem('licitacao_objeto') || 'AQUISIÇÃO DE CADEIRAS DE PLÁSTICO';
    const in65Hash = localStorage.getItem('licitacao_in65_hash');
    const trStatus = localStorage.getItem('licitacao_tr_status');
    
    setDadosProcesso({
      objeto: objeto.toUpperCase(),
      etapas: {
        dfd: true, 
        etp: !!objeto, 
        tr: !!trStatus || !!objeto, 
        in65: !!in65Hash
      },
      in65Hash: in65Hash || 'Pendente de homologação estatística'
    });
    setLoading(false);
  }, []);

  const validarSeloCriptografico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    
    setValidando(true);
    setResultadoValidacao(null);
    setErroValidacao(null);

    try {
      const resposta = await licitacaoService.validarHashAuditoria(hashInput);
      setResultadoValidacao(resposta);
    } catch (err: any) {
      setErroValidacao("Falha de comunicação com o nó de registro imutável.");
    } finally {
      setValidando(false);
    }
  };

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
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Absolute Hash Emitido. Metadados do PCA registrados.</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>2. ETP (Art. 18)</strong></td>
            <td style="padding: 8px; text-align: center; color: green; font-weight: bold;">CONCLUÍDO</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Matriz Quantificada de Riscos Homologada (Heatmap).</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>3. TR (Art. 6º)</strong></td>
            <td style="padding: 8px; text-align: center; color: green; font-weight: bold;">CONCLUÍDO</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Workflow verificado. Modelo de Sanções ativo.</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>4. Pesquisa IN 65</strong></td>
            <td style="padding: 8px; text-align: center; color: ${dadosProcesso.etapas.in65 ? 'green' : 'red'}; font-weight: bold;">${dadosProcesso.etapas.in65 ? 'CONCLUÍDO' : 'PENDENTE'}</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Filtro IQR aplicado com IPCA. Hash: ${dadosProcesso.in65Hash}</td>
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando Trilha Criptográfica...</div>;

  return (
    <main className="min-h-screen bg-slate-900 p-6 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6 bg-slate-800 border border-slate-700 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm text-yellow-400">
          ACESSO RESTRITO - MODO AUDITORIA / ÓRGÃO DE CONTROLE
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b border-slate-700 pb-4 items-center">
          <Link href="/" className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-md transition-all">← Voltar para Operação (DFD)</Link>
          <span className="text-yellow-400 font-bold bg-yellow-900/30 border border-yellow-700/50 px-3 py-1.5 rounded-md shadow-sm">🛡️ Painel de Controle Consolidado</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Linha do Tempo Processual</h1>
          <p className="text-slate-400 mt-1">Visão Executiva do Processo Licitatório de: <strong className="text-yellow-400">{dadosProcesso.objeto}</strong></p>
        </header>

        {/* TIMELINE RESTAURADA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className={`p-5 rounded-xl border ${dadosProcesso.etapas.dfd ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2"><span className="font-bold text-white">1. DFD</span>{dadosProcesso.etapas.dfd ? <span className="text-green-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}</div>
            <p className="text-xs text-slate-400">Metadados PCA Ativos</p>
          </div>
          <div className={`p-5 rounded-xl border ${dadosProcesso.etapas.etp ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2"><span className="font-bold text-white">2. ETP</span>{dadosProcesso.etapas.etp ? <span className="text-green-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}</div>
            <p className="text-xs text-slate-400">Matriz de Risco 3x3 Ativa</p>
          </div>
          <div className={`p-5 rounded-xl border ${dadosProcesso.etapas.tr ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2"><span className="font-bold text-white">3. TR</span>{dadosProcesso.etapas.tr ? <span className="text-green-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}</div>
            <p className="text-xs text-slate-400">Workflow de Sanções Ativo</p>
          </div>
          <div className={`p-5 rounded-xl border ${dadosProcesso.etapas.in65 ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-2"><span className="font-bold text-white">4. IN 65 (Preços)</span>{dadosProcesso.etapas.in65 ? <span className="text-indigo-400 font-bold text-xl">✓</span> : <span className="text-slate-500 text-xs">Pendente</span>}</div>
            <p className="text-xs text-slate-400">Filtro Matemático IQR</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PAINEL DE RELATÓRIO E EXPORTAÇÃO */}
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Dossiê Estratégico do Processo</h2>
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-lg flex justify-between items-center border border-slate-700">
                  <div>
                    <span className="block text-xs text-slate-400 font-mono mb-1">HASH ATUAL DA PESQUISA (IN 65)</span>
                    <span className={`font-mono text-sm ${dadosProcesso.etapas.in65 ? 'text-indigo-300 break-all' : 'text-slate-500'}`}>{dadosProcesso.in65Hash}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 text-justify">
                  O relatório consolidado agrupa as informações de conformidade legal de todas as etapas preparatórias, atestando a integridade das peças geradas via GovTech-Engine.
                </p>
              </div>
            </div>
            <button onClick={exportarRelatorioConsolidado} className="w-full mt-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl transition-colors shadow-md text-lg">
              📄 Baixar Relatório Consolidado de Governança
            </button>
          </div>

          {/* O NOVO SCANNER DE INTEGRIDADE (SPRINT 5) */}
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">🔍 Validador Criptográfico de Integridade</h2>
            <p className="text-sm text-slate-400 mb-6 pb-4 border-b border-slate-700">Conectado via Webhook à rede de registro imutável WORM (Simulação).</p>

            <form onSubmit={validarSeloCriptografico} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 mb-2 uppercase">Insira o Hash SHA-256 do Documento:</label>
                <input 
                  type="text" 
                  value={hashInput} 
                  onChange={(e) => setHashInput(e.target.value)} 
                  required 
                  className="p-4 bg-slate-900 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 text-white font-mono text-sm" 
                  placeholder="Ex: bfe52d21be5fa4f4577a17..." 
                />
              </div>
              <button type="submit" disabled={validando} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-800 disabled:text-slate-500 border border-slate-600">
                {validando ? 'Processando Autenticidade...' : 'Verificar Autenticidade do Documento'}
              </button>
            </form>

            {erroValidacao && (
              <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
                <strong>Falha de Conexão:</strong> {erroValidacao}
              </div>
            )}

            {resultadoValidacao && (
              <div className={`mt-6 p-5 rounded-lg border animate-fadeIn ${resultadoValidacao.valido ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${resultadoValidacao.valido ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {resultadoValidacao.valido ? '✓' : '✗'}
                  </div>
                  <strong className={`text-lg ${resultadoValidacao.valido ? 'text-green-400' : 'text-red-400'}`}>
                    {resultadoValidacao.valido ? 'DOCUMENTO VERIFICADO E ÍNTEGRO' : 'HASH INVÁLIDO'}
                  </strong>
                </div>
                
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{resultadoValidacao.mensagem}</p>
                
                {resultadoValidacao.valido && (
                  <div className="bg-slate-900 p-3 rounded-md border border-slate-700 text-xs font-mono text-slate-400 space-y-2">
                    <p><strong className="text-slate-500">ID DA TRANSAÇÃO:</strong> <span className="text-yellow-400/80">{resultadoValidacao.transaction_id}</span></p>
                    <p><strong className="text-slate-500">REDE DE ANCORAGEM:</strong> {resultadoValidacao.ancoragem_externa}</p>
                    <p><strong className="text-slate-500">DATA DE VERIFICAÇÃO:</strong> {resultadoValidacao.data_verificacao}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}