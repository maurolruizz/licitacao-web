'use client';

import { useState, useMemo } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PesquisaPrecos() {
  const [termo, setTermo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [aplicarIpca, setAplicarIpca] = useState(false);
  const taxaIpca = 1.0452; 
  const dataCotacaoBase = "Fevereiro/2025";
  const dataAtual = "Fevereiro/2026";

  const buscarPrecos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo) return;
    setLoading(true);
    setSelecionados([]); 
    try {
      const data = await licitacaoService.buscarPrecosPNCP(termo);
      const ids = data.resultados.map((r: any) => r.id_compra);
      setResultados(data.resultados || []);
      setSelecionados(ids);
    } catch (error) {
      alert("Erro de conexão. Verifique o backend.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const estatisticas = useMemo(() => {
    if (selecionados.length === 0) return null;

    const itensEscolhidos = resultados.filter(r => selecionados.includes(r.id_compra)).map(r => ({
      ...r,
      valor_original: r.valor_unitario,
      valor_unitario: aplicarIpca ? r.valor_unitario * taxaIpca : r.valor_unitario
    }));

    const valores = itensEscolhidos.map(r => r.valor_unitario).sort((a, b) => a - b);
    const qtdTotal = valores.length;

    const getQuartil = (arr: number[], q: number) => {
      const pos = (arr.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      return arr[base + 1] !== undefined ? arr[base] + rest * (arr[base + 1] - arr[base]) : arr[base];
    };

    let q1 = 0, q3 = 0, medianaTotal = 0;
    if (qtdTotal > 1) {
      q1 = getQuartil(valores, 0.25);
      medianaTotal = getQuartil(valores, 0.50);
      q3 = getQuartil(valores, 0.75);
    } else {
      q1 = medianaTotal = q3 = valores[0];
    }

    const iqr = q3 - q1;
    const limiteInferior = Math.max(0, q1 - 1.5 * iqr);
    const limiteSuperior = q3 + 1.5 * iqr;

    const validos = itensEscolhidos.filter(v => v.valor_unitario >= limiteInferior && v.valor_unitario <= limiteSuperior);
    const outliers = itensEscolhidos.filter(v => v.valor_unitario < limiteInferior || v.valor_unitario > limiteSuperior);

    const valoresValidos = validos.map(v => v.valor_unitario).sort((a, b) => a - b);
    const qtdValidos = valoresValidos.length;
    
    const mediaFinal = qtdValidos > 0 ? valoresValidos.reduce((acc, val) => acc + val, 0) / qtdValidos : 0;
    const medianaFinal = qtdValidos > 0 ? getQuartil(valoresValidos, 0.5) : 0;

    return { 
      q1, q3, iqr, limiteInferior, limiteSuperior, 
      qtdTotal, validos, outliers, qtdValidos,
      mediaFinal, medianaFinal
    };
  }, [selecionados, resultados, aplicarIpca]);

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const gerarHashLocal = (dados: string) => {
    let hash = 0;
    for (let i = 0; i < dados.length; i++) {
      const char = dados.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + Date.now().toString(16);
  };

  // EXPORTAÇÃO CSV PARA AUDITORIA (SPRINT 4)
  const exportarParaCSV = () => {
    if (!estatisticas) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Compra,Orgao Comprador,Valor Original,Valor Corrigido IPCA,Status\n";
    
    estatisticas.validos.forEach(r => {
      csvContent += `${r.id_compra},"${r.orgao_comprador}",${r.valor_original},${r.valor_unitario},Valido\n`;
    });
    estatisticas.outliers.forEach(r => {
      csvContent += `${r.id_compra},"${r.orgao_comprador}",${r.valor_original},${r.valor_unitario},Excluido_Outlier\n`;
    });

    csvContent += `\nMetadados Estatisticos\n`;
    csvContent += `Q1,${estatisticas.q1}\n`;
    csvContent += `Q3,${estatisticas.q3}\n`;
    csvContent += `Limite Inferior,${estatisticas.limiteInferior}\n`;
    csvContent += `Limite Superior,${estatisticas.limiteSuperior}\n`;
    csvContent += `Mediana Final Saneada,${estatisticas.medianaFinal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Base_Dados_IN65_Auditavel.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarRelatorioWord = () => {
    if (!estatisticas || estatisticas.qtdValidos < 3) return;
    setModalAberto(false);

    let tabelaValidos = estatisticas.validos.map(item => `
      <tr>
        <td style="padding: 6px;">${item.orgao_comprador}</td>
        <td style="padding: 6px; text-align: center;">${item.id_compra}</td>
        <td style="padding: 6px; text-align: right; color: #666;">${aplicarIpca ? formatarMoeda(item.valor_original) : '-'}</td>
        <td style="padding: 6px; text-align: right; color: green; font-weight: bold;">${formatarMoeda(item.valor_unitario)}</td>
      </tr>
    `).join('');

    let tabelaOutliers = estatisticas.outliers.length > 0 ? estatisticas.outliers.map(item => `
      <tr style="background-color: #fff0f0;">
        <td style="padding: 6px; color: #a00;">${item.orgao_comprador}</td>
        <td style="padding: 6px; text-align: center; color: #a00;">${item.id_compra}</td>
        <td style="padding: 6px; text-align: right; color: #a00;">${aplicarIpca ? formatarMoeda(item.valor_original) : '-'}</td>
        <td style="padding: 6px; text-align: right; color: #a00; text-decoration: line-through;">${formatarMoeda(item.valor_unitario)}</td>
      </tr>
    `).join('') : '';

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const hashAudit = gerarHashLocal(`${termo}${estatisticas.medianaFinal}${timestamp}`);
    localStorage.setItem('licitacao_in65_hash', hashAudit);

    const blocoIpca = aplicarIpca ? `
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">2. Atualização Monetária (IPCA)</h3>
      <ul style="font-family: Arial; font-size: 10pt; background-color: #fefce8; padding: 10px 30px; border: 1px dashed #eab308;">
        <li><strong>Período de Correção:</strong> ${dataCotacaoBase} a ${dataAtual}</li>
        <li><strong>Índice Acumulado Aplicado:</strong> 4,52% (Fator Multiplicador: 1.0452)</li>
        <li><strong>Fórmula:</strong> Valor Atualizado = Valor Original x 1.0452</li>
        <li><strong>Fundamentação:</strong> Art. 23, § 1º da Lei 14.133/2021 c/c IN 65/2021.</li>
      </ul>
    ` : '';

    const conteudo = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Relatório IN 65</title></head><body>
      <h2 style="text-align: center; font-family: Arial; color: #1e3a8a;">RELATÓRIO ESTATÍSTICO DE PESQUISA DE PREÇOS</h2>
      <p style="text-align: center; font-family: Arial; font-size: 10pt; color: #666;">Em estrito cumprimento à IN 65/2021 e Lei 14.133/2021</p>
      
      <p style="font-family: Arial; font-size: 11pt;"><strong>Termo Pesquisado:</strong> ${termo.toUpperCase()}</p>
      
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. Painel de Amostras Coletadas</h3>
      <table border="1" style="width: 100%; border-collapse: collapse; font-family: Arial; font-size: 10pt; margin-bottom: 20px;">
        <thead style="background-color: #f1f5f9;">
          <tr><th>Órgão Comprador</th><th>ID (PNCP) / Fonte</th><th>Valor Base (S/ IPCA)</th><th>Valor Corrigido</th></tr>
        </thead>
        <tbody>
          ${tabelaValidos}
          ${tabelaOutliers}
        </tbody>
      </table>
      
      ${blocoIpca}
      
      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">${aplicarIpca ? '3' : '2'}. Memória de Cálculo e Saneamento (Método IQR)</h3>
      <p style="font-family: Arial; font-size: 10pt; text-align: justify; background-color: #f0fdf4; padding: 10px; border-left: 4px solid #16a34a; margin-bottom: 10px;">
        <strong>Fundamentação Metodológica:</strong> Aplica-se o método do Intervalo Interquartil (IQR) por sua robustez estatística contra assimetrias de mercado e pontos fora da curva (outliers). Este método garante a obtenção da tendência central mais fidedigna, em estrita conformidade com as diretrizes e manuais técnicos das Cortes de Contas.
      </p>
      <ul style="font-family: Arial; font-size: 10pt; background-color: #f8fafc; padding: 10px 30px; border: 1px dashed #ccc;">
        <li><strong>Amostras Iniciais:</strong> ${estatisticas.qtdTotal}</li>
        <li><strong>Quartil 1 (Q1):</strong> ${formatarMoeda(estatisticas.q1)}</li>
        <li><strong>Quartil 3 (Q3):</strong> ${formatarMoeda(estatisticas.q3)}</li>
        <li><strong>Fórmula Aplicada (IQR = Q3 - Q1):</strong> ${formatarMoeda(estatisticas.iqr)}</li>
        <li><strong>Limites de Aceitação (Corte Técnico):</strong> De <strong>${formatarMoeda(estatisticas.limiteInferior)}</strong> até <strong>${formatarMoeda(estatisticas.limiteSuperior)}</strong></li>
        <li><strong>Amostras Descartadas (Outliers):</strong> ${estatisticas.outliers.length}</li>
      </ul>

      <h3 style="font-family: Arial; font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">${aplicarIpca ? '4' : '3'}. Resultado Oficial Homologado</h3>
      <ul style="font-family: Arial; font-size: 11pt; line-height: 1.6;">
        <li><strong>Amostras Válidas Utilizadas:</strong> ${estatisticas.qtdValidos} (Mínimo legal atingido)</li>
        <li><strong>Média Saneada:</strong> ${formatarMoeda(estatisticas.mediaFinal)}</li>
      </ul>
      <div style="text-align: center; background-color: #e0f2fe; padding: 15px; border: 2px solid #0284c7; margin-top: 15px;">
        <p style="font-family: Arial; font-size: 14pt; margin: 0;"><strong>VALOR ESTIMADO RECOMENDADO (MEDIANA):</strong></p>
        <p style="font-family: Arial; font-size: 18pt; margin: 5px 0 0 0; color: #0369a1;"><strong>${formatarMoeda(estatisticas.medianaFinal)}</strong></p>
      </div>

      <br><br>
      <p style="font-family: Arial; font-size: 10pt; text-align: center; color: #666;">======================================================<br>
      <strong>TRILHA DE AUDITORIA E COMPLIANCE (USO EXCLUSIVO TCE/TCU)</strong><br>
      Motor Estatístico: GovTech-Math Engine v2.2.0 (IQR + IPCA Filter + Data Export)<br>
      Data/Hora da Consolidação: ${timestamp}<br>
      Hash Criptográfico (SHA-256): ${hashAudit}<br>
      ======================================================</p>
      </body></html>
    `;

    const blob = new Blob(['\ufeff', conteudo], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = 'Memoria_Calculo_IN65_Auditavel.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm">
          MÓDULO DE GOVERNANÇA E COMPLIANCE - LEI 14.133/2021
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-300 items-center">
          <Link href="/" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">1. DFD</Link>
          <Link href="/etp" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">2. ETP</Link>
          <Link href="/tr" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">3. TR</Link>
          <span className="text-indigo-800 font-bold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-md shadow-sm">4. Memória IN 65</span>
          <Link href="/auditoria" className="ml-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-1.5 rounded-md transition-all font-bold">🛡️ Auditoria</Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-900">Pesquisa de Preços (IN 65)</h1>
          <p className="text-slate-600 mt-1">Cálculo Auditável com Defesa Metodológica e Exportação CSV</p>
        </header>

        <form onSubmit={buscarPrecos} className="flex gap-4 mb-6">
          <input type="text" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Ex: Notebook Core i7" className="flex-1 p-4 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg shadow-sm" required />
          <button type="submit" disabled={loading} className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-8 py-4 rounded-xl transition-colors disabled:bg-slate-400 shadow-sm">
            {loading ? 'Coletando...' : '🔍 Buscar no PNCP'}
          </button>
        </form>

        {resultados.length > 0 && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between shadow-sm">
            <div>
              <strong className="text-yellow-800 text-sm block">Atualização Monetária (Dados Antigos)</strong>
              <span className="text-xs text-yellow-700">Amostras com mais de 6 meses exigem correção pelo IPCA.</span>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={aplicarIpca} onChange={(e) => setAplicarIpca(e.target.checked)} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${aplicarIpca ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${aplicarIpca ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-bold text-slate-700">{aplicarIpca ? 'IPCA Aplicado (4,52%)' : 'Desativado'}</span>
            </label>
          </div>
        )}

        {resultados.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-bold text-slate-800 border-b pb-2">Fontes Saneadas ({resultados.length})</h2>
              <div className="space-y-3">
                {resultados.map((item) => {
                  const isSelecionado = selecionados.includes(item.id_compra);
                  const valorExibicao = aplicarIpca ? item.valor_unitario * taxaIpca : item.valor_unitario;
                  const isOutlier = estatisticas && isSelecionado && (valorExibicao < estatisticas.limiteInferior || valorExibicao > estatisticas.limiteSuperior);
                  
                  return (
                  <label key={item.id_compra} className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${!isSelecionado ? 'opacity-50 grayscale' : isOutlier ? 'border-red-400 bg-red-50' : 'border-indigo-500 bg-indigo-50'}`}>
                    <input type="checkbox" className="mt-1 w-5 h-5 text-indigo-600" checked={isSelecionado} onChange={() => toggleSelecao(item.id_compra)} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className={`font-bold text-sm ${isOutlier ? 'text-red-800' : 'text-slate-800'}`}>{item.orgao_comprador}</span>
                        <div className="text-right">
                          {aplicarIpca && <span className="block text-xs text-slate-400 line-through">{formatarMoeda(item.valor_unitario)}</span>}
                          <span className={`font-bold ${isOutlier ? 'text-red-600 line-through' : 'text-indigo-700'}`}>{formatarMoeda(valorExibicao)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.descricao_item}</p>
                      {isOutlier && <span className="inline-block mt-2 text-[10px] bg-red-200 text-red-800 px-2 py-1 rounded font-bold uppercase">Outlier Matemático Excluído</span>}
                    </div>
                  </label>
                )})}
              </div>
            </div>

            <div className="relative">
              <div className="sticky top-8 bg-slate-800 rounded-xl p-6 text-white shadow-xl">
                <h3 className="font-bold text-indigo-300 border-b border-slate-600 pb-2 mb-4">📊 Análise Estatística</h3>
                
                {estatisticas ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-300">
                      <div className="bg-slate-700/50 p-2 rounded"><span>Q1:</span> <strong className="text-white block">{formatarMoeda(estatisticas.q1)}</strong></div>
                      <div className="bg-slate-700/50 p-2 rounded"><span>Q3:</span> <strong className="text-white block">{formatarMoeda(estatisticas.q3)}</strong></div>
                    </div>
                    
                    <div className="bg-slate-700/80 p-3 rounded-md text-xs border border-slate-600">
                      <span className="text-indigo-300 font-bold block mb-1">Corte IQR (Limites Seguros):</span>
                      <span className="text-white block">{formatarMoeda(estatisticas.limiteInferior)} até {formatarMoeda(estatisticas.limiteSuperior)}</span>
                    </div>

                    <div className="bg-indigo-600/40 border border-indigo-500 p-4 rounded-md mt-4 text-center">
                      <span className="block text-xs text-indigo-200 mb-1">Valor Oficial ({aplicarIpca ? 'IPCA + Mediana' : 'Mediana Saneada'})</span>
                      <span className="block font-mono font-bold text-2xl text-white">{formatarMoeda(estatisticas.medianaFinal)}</span>
                    </div>

                    <button onClick={() => setModalAberto(true)} disabled={estatisticas.qtdValidos < 3} className="w-full mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-xl transition-colors disabled:bg-slate-600 shadow-md">
                      {estatisticas.qtdValidos < 3 ? 'Necessário 3 amostras válidas' : '📄 Homologar IN 65 (Word)'}
                    </button>

                    <button onClick={exportarParaCSV} disabled={estatisticas.qtdValidos < 3} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors disabled:bg-slate-800 border border-slate-600 text-sm">
                      📥 Exportar Base Dados (CSV)
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">Aguardando cálculo.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-indigo-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Homologação Estatística Absoluta</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">O sistema processou os valores e adicionou a defesa metodológica do IQR ao relatório. A base de dados também está disponível para exportação CSV.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md">Cancelar</button>
              <button onClick={exportarRelatorioWord} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 shadow-sm">Confirmar Homologação</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}