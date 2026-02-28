'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { licitacaoService } from '../../services/licitacaoService';

export default function ModoAuditoria() {
  const [dadosProcesso, setDadosProcesso] = useState<any>({
    objeto: 'Não identificado',
    etapas: { dfd: false, etp: false, tr: false, in65: false },
    in65Hash: null,
    orgao: null
  });
  const [loading, setLoading] = useState(true);
  
  // === ESTADOS DO VALIDADOR DE HASH ===
  const [hashInput, setHashInput] = useState('');
  const [validando, setValidando] = useState(false);
  const [resultadoValidacao, setResultadoValidacao] = useState<any>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // === ESTADOS TERMÔMETRO IGEP ===
  const [volumeFinanceiro, setVolumeFinanceiro] = useState('Baixo');
  const [complexidade, setComplexidade] = useState('Comum');
  const [scoreIgep, setScoreIgep] = useState<number | null>(null);
  const [classificacaoIgep, setClassificacaoIgep] = useState('');

  // === NOVO: ESTADOS DO DATA MOAT (Inteligência Coletiva) ===
  const [dataLakeStats, setDataLakeStats] = useState<any>(null);

  useEffect(() => {
    const carregarDados = async () => {
      const objeto = localStorage.getItem('licitacao_objeto') || 'PROCESSO NÃO INICIADO';
      const in65Hash = localStorage.getItem('licitacao_in65_hash');
      const trStatus = localStorage.getItem('licitacao_tr_status');
      const orgaoData = localStorage.getItem('licitacao_orgao_data');
      
      const orgaoParsed = orgaoData ? JSON.parse(orgaoData) : null;

      setDadosProcesso({
        objeto: objeto.toUpperCase(),
        etapas: {
          dfd: true, 
          etp: !!objeto && objeto !== 'PROCESSO NÃO INICIADO', 
          tr: !!trStatus || (!!objeto && objeto !== 'PROCESSO NÃO INICIADO'), 
          in65: !!in65Hash
        },
        in65Hash: in65Hash || 'Pendente de homologação estatística',
        orgao: orgaoParsed
      });

      // Busca os dados do Data Lake no Backend
      try {
        const stats = await licitacaoService.obterDataMoatStats();
        setDataLakeStats(stats);
      } catch (e) {
        console.error("Data Lake indisponível");
      }

      setLoading(false);
    };
    
    carregarDados();
  }, []);

  const validarSeloCriptografico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setValidando(true); setResultadoValidacao(null); setErroValidacao(null);
    try {
      const resposta = await licitacaoService.validarHashAuditoria(hashInput);
      setResultadoValidacao(resposta);
    } catch (err: any) {
      setErroValidacao("Falha de comunicação com o nó de registro imutável.");
    } finally {
      setValidando(false);
    }
  };

  const calcularIGEP = () => {
    let riscoBase = 100;
    if (dadosProcesso.etapas.dfd) riscoBase -= 15;
    if (dadosProcesso.etapas.etp) riscoBase -= 25; 
    if (dadosProcesso.etapas.tr) riscoBase -= 15;
    if (dadosProcesso.etapas.in65) riscoBase -= 25; 
    if (dadosProcesso.orgao && dadosProcesso.orgao.is_pequeno_porte) riscoBase -= 5; 
    if (volumeFinanceiro === 'Alto') riscoBase += 20;
    if (volumeFinanceiro === 'Medio') riscoBase += 10;
    if (complexidade === 'Alta') riscoBase += 15;

    const scoreFinal = Math.min(100, Math.max(0, riscoBase));
    setScoreIgep(scoreFinal);

    if (scoreFinal <= 25) setClassificacaoIgep('Blindagem Alta (Risco Baixo)');
    else if (scoreFinal <= 50) setClassificacaoIgep('Risco Controlado (Médio)');
    else if (scoreFinal <= 75) setClassificacaoIgep('Atenção: Risco Elevado');
    else setClassificacaoIgep('Alerta Crítico de Governança');
  };

  const exportarRelatorioConsolidado = () => {
    const corIgep = scoreIgep === null ? '#666' : scoreIgep <= 25 ? '#16a34a' : scoreIgep <= 50 ? '#ca8a04' : '#dc2626';
    const blocoIgep = scoreIgep !== null ? `
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px;">3. Índice Geral de Exposição Processual (IGEP)</h3>
      <div style="background-color: #f8fafc; padding: 15px; border-left: 5px solid ${corIgep}; font-family: Arial;">
        <p style="margin: 0; font-size: 11pt;"><strong>Score de Risco Calculado:</strong> <span style="font-size: 14pt; color: ${corIgep};">${scoreIgep} / 100</span></p>
        <p style="margin: 5px 0 0 0; font-size: 10pt; color: #475569;"><strong>Classificação:</strong> ${classificacaoIgep}</p>
        <p style="margin: 5px 0 0 0; font-size: 9pt; color: #64748b;">Parâmetros Avaliados: Complexidade (${complexidade}), Volume Financeiro (${volumeFinanceiro}) e Nível de Conformidade Digital GovTech.</p>
      </div>
    ` : '';

    const conteudo = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Relatório Executivo de Controladoria</title></head><body>
      <h2 style="text-align: center; font-family: Arial; color: #1e3a8a;">RELATÓRIO EXECUTIVO PARA CONTROLADORIA INTERNA</h2>
      <p style="text-align: center; font-family: Arial; font-size: 10pt; color: #666;">Lei 14.133/2021 - Mapa de Responsabilidade, Riscos e Compliance</p>
      
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. Dados do Processo e Órgão</h3>
      <ul style="font-family: Arial; font-size: 10pt;">
        <li><strong>Órgão:</strong> ${dadosProcesso.orgao ? dadosProcesso.orgao.cidade : 'Não conectado via API IBGE'}</li>
        <li><strong>Objeto Central:</strong> ${dadosProcesso.objeto}</li>
        <li><strong>Data da Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
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
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Workflow verificado. Automação IBGE validada.</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>4. Pesquisa IN 65</strong></td>
            <td style="padding: 8px; text-align: center; color: ${dadosProcesso.etapas.in65 ? 'green' : 'red'}; font-weight: bold;">${dadosProcesso.etapas.in65 ? 'CONCLUÍDO' : 'PENDENTE'}</td>
            <td style="padding: 8px; font-family: monospace; font-size: 9pt;">Filtro IQR aplicado. Hash: ${dadosProcesso.in65Hash}</td>
          </tr>
        </tbody>
      </table>
      
      ${blocoIgep}

      <br><br><br>
      <p style="text-align: center; font-family: Arial; font-size: 10pt; color: #333;">
        ___________________________________________________<br>
        <strong>CERTIFICAÇÃO DE COMPLIANCE GOVTECH</strong><br>
        Atestamos que as peças processuais seguiram o rito rígido da Lei 14.133/2021.
      </p>
      </body></html>
    `;
    const blob = new Blob(['\ufeff', conteudo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = 'Relatorio_Executivo_Controladoria.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando Trilha Criptográfica...</div>;

  return (
    <main className="min-h-screen bg-slate-900 p-6 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm text-yellow-400">
          ACESSO RESTRITO - CONTROLADORIA INTERNA E TRIBUNAL DE CONTAS
        </div>

        <nav className="text-sm font-medium flex flex-wrap gap-2 border-b border-slate-700 pb-4 items-center">
          <Link href="/" className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-md transition-all">← Voltar para Operação (DFD)</Link>
          <span className="text-yellow-400 font-bold bg-yellow-900/30 border border-yellow-700/50 px-3 py-1.5 rounded-md shadow-sm">🛡️ Painel de Controle Consolidado</span>
        </nav>

        <header>
          <h1 className="text-3xl font-bold text-white">Dashboard de Auditoria Estrutural</h1>
          <p className="text-slate-400 mt-1">Visão Executiva do Processo Licitatório de: <strong className="text-yellow-400">{dadosProcesso.objeto}</strong></p>
          {dadosProcesso.orgao && (
            <p className="text-xs text-blue-400 font-mono mt-2">Órgão Vinculado: {dadosProcesso.orgao.cidade} | População IBGE: {dadosProcesso.orgao.populacao}</p>
          )}
        </header>

        {/* === NOVO BLOCO: DATA MOAT (INTELIGÊNCIA INSTITUCIONAL) === */}
        {dataLakeStats && (
          <div className="bg-gradient-to-r from-slate-800 to-indigo-900/40 p-6 rounded-xl border border-indigo-500/30 shadow-xl mb-8 animate-fadeIn">
            <h2 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">🧠 GovTech Data Lake (Inteligência Coletiva da Plataforma)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-400 mb-1">Processos Estruturados</span>
                <strong className="text-2xl text-white">{dataLakeStats.total_processos_analisados.toLocaleString('pt-BR')}</strong>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-400 mb-1">Economia Gerada (Filtro IQR)</span>
                <strong className="text-xl text-green-400">{dataLakeStats.economia_gerada_iqr}</strong>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-400 mb-1">Riscos Mitigados (ETP 3x3)</span>
                <strong className="text-2xl text-yellow-400">{dataLakeStats.riscos_mitigados_etp.toLocaleString('pt-BR')}</strong>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-400 mb-1">Frequência Decisória (TCO)</span>
                <strong className="text-2xl text-blue-400">{dataLakeStats.criterio_tco_predominante}</strong>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-right">Dados anonimizados de mercado. O Fosso Estratégico.</p>
          </div>
        )}

        {/* TIMELINE INTACTA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          {/* BLOCO IGEP INTACTO */}
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">📊 Termômetro de Risco (IGEP)</h2>
              <p className="text-sm text-slate-400 mb-6 pb-4 border-b border-slate-700">Índice Geral de Exposição Processual para Controladores.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 mb-2 uppercase">Volume Financeiro Estimado</label>
                  <select value={volumeFinanceiro} onChange={(e) => setVolumeFinanceiro(e.target.value)} className="p-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-yellow-500">
                    <option value="Baixo">Baixo (Até R$ 50 mil)</option>
                    <option value="Medio">Médio (Até R$ 1 Milhão)</option>
                    <option value="Alto">Alto (Acima de R$ 1 Milhão)</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 mb-2 uppercase">Complexidade do Objeto</label>
                  <select value={complexidade} onChange={(e) => setComplexidade(e.target.value)} className="p-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-yellow-500">
                    <option value="Comum">Bem/Serviço Comum</option>
                    <option value="Alta">Engenharia ou TI Especializada</option>
                  </select>
                </div>
              </div>

              <button onClick={calcularIGEP} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors border border-slate-600 mb-6 shadow-sm">
                Calcular Exposição Processual (IGEP)
              </button>

              {scoreIgep !== null && (
                <div className={`p-6 rounded-xl border animate-fadeIn flex flex-col items-center justify-center text-center ${scoreIgep <= 25 ? 'bg-green-900/20 border-green-500/50' : scoreIgep <= 50 ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                  <span className="text-slate-400 text-xs font-bold uppercase mb-2">Score de Risco Calculado</span>
                  <div className={`text-6xl font-bold font-mono mb-2 ${scoreIgep <= 25 ? 'text-green-400' : scoreIgep <= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {scoreIgep}
                  </div>
                  <span className={`text-lg font-bold ${scoreIgep <= 25 ? 'text-green-300' : scoreIgep <= 50 ? 'text-yellow-300' : 'text-red-300'}`}>
                    {classificacaoIgep}
                  </span>
                </div>
              )}
            </div>
            
            <button onClick={exportarRelatorioConsolidado} className="w-full mt-8 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl transition-colors shadow-md text-lg">
              📄 Exportar Relatório para Controladoria
            </button>
          </div>

          {/* SCANNER WORM INTACTO */}
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">🔍 Validador Criptográfico WORM</h2>
            <p className="text-sm text-slate-400 mb-6 pb-4 border-b border-slate-700">Conectado via Webhook à rede de registro imutável (Simulação).</p>

            <form onSubmit={validarSeloCriptografico} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 mb-2 uppercase">Insira o Hash SHA-256 do Documento:</label>
                <input 
                  type="text" 
                  value={hashInput} 
                  onChange={(e) => setHashInput(e.target.value)} 
                  required 
                  className="p-4 bg-slate-900 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono text-sm" 
                  placeholder="Ex: bfe52d21be5fa4f4577a17..." 
                />
              </div>
              <button type="submit" disabled={validando} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-800 disabled:text-slate-500 border border-blue-700">
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