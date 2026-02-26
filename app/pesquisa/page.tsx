'use client';

import { useState, useMemo } from 'react';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PesquisaPrecos() {
  const [termo, setTermo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const buscarPrecos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo) return;
    
    setLoading(true);
    setSelecionados([]); 
    try {
      const data = await licitacaoService.buscarPrecosPNCP(termo);
      setResultados(data.resultados || []);
    } catch (error) {
      alert("Erro ao buscar preços. Verifique se o motor Python está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const estatisticas = useMemo(() => {
    if (selecionados.length === 0) return null;

    const valores = resultados
      .filter(r => selecionados.includes(r.id_compra))
      .map(r => r.valor_unitario)
      .sort((a, b) => a - b); 

    const qtd = valores.length;
    const soma = valores.reduce((acc, val) => acc + val, 0);
    const media = soma / qtd;
    
    let mediana = 0;
    if (qtd % 2 === 0) {
      mediana = (valores[qtd / 2 - 1] + valores[qtd / 2]) / 2;
    } else {
      mediana = valores[Math.floor(qtd / 2)];
    }

    const menorPreco = valores[0];
    const maiorPreco = valores[qtd - 1];

    return { media, mediana, menorPreco, maiorPreco, qtd };
  }, [selecionados, resultados]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // ====================================================================
  // MOTOR DE EXPORTAÇÃO BLINDADO (USANDO BLOB PARA EVITAR BLOQUEIOS)
  // ====================================================================
  const exportarRelatorioWord = () => {
    if (!estatisticas || selecionados.length < 3) return;

    const itensSelecionados = resultados.filter(r => selecionados.includes(r.id_compra));

    let tabelaHTML = `
      <table border="1" style="width: 100%; border-collapse: collapse; font-family: Arial; font-size: 10pt; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px;">Órgão Comprador</th>
            <th style="padding: 8px;">Data Publicação</th>
            <th style="padding: 8px;">ID (PNCP)</th>
            <th style="padding: 8px;">Valor Unitário</th>
          </tr>
        </thead>
        <tbody>
          ${itensSelecionados.map(item => `
            <tr>
              <td style="padding: 8px;">${item.orgao_comprador}</td>
              <td style="padding: 8px; text-align: center;">${item.data_publicacao}</td>
              <td style="padding: 8px; text-align: center;">${item.id_compra}</td>
              <td style="padding: 8px; text-align: right;">${formatarMoeda(item.valor_unitario)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Memória de Cálculo IN 65</title></head><body>";
    const footer = "</body></html>";
    
    const conteudo = `
      <h2 style="text-align: center; font-family: Arial;">RELATÓRIO DE PESQUISA DE PREÇOS (IN 65/2021)</h2>
      <p style="font-family: Arial; font-size: 11pt;"><strong>Termo Pesquisado:</strong> ${termo.toUpperCase()}</p>
      <p style="font-family: Arial; font-size: 11pt;"><strong>Data da Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      
      <h3 style="font-family: Arial; font-size: 12pt; margin-top: 20px;">1. Fontes Selecionadas (Curadoria Humana)</h3>
      ${tabelaHTML}
      
      <h3 style="font-family: Arial; font-size: 12pt;">2. Memória de Cálculo Estatística</h3>
      <ul style="font-family: Arial; font-size: 11pt; line-height: 1.6;">
        <li><strong>Quantidade de Amostras Válidas:</strong> ${estatisticas.qtd}</li>
        <li><strong>Média Aritmética:</strong> ${formatarMoeda(estatisticas.media)}</li>
        <li><strong>Menor Preço Encontrado:</strong> ${formatarMoeda(estatisticas.menorPreco)}</li>
        <li><strong>Maior Preço Encontrado:</strong> ${formatarMoeda(estatisticas.maiorPreco)}</li>
      </ul>
      <p style="font-family: Arial; font-size: 12pt; text-align: center; background-color: #f2f2f2; padding: 10px; border: 1px solid #ccc;">
        <strong>VALOR ESTIMADO RECOMENDADO (MEDIANA): ${formatarMoeda(estatisticas.mediana)}</strong>
      </p>

      <h3 style="font-family: Arial; font-size: 12pt; margin-top: 30px;">3. Termo de Validação e Responsabilidade</h3>
      <p style="font-family: Arial; font-size: 11pt; text-align: justify; line-height: 1.5;">
        Declaro para os devidos fins legais, em estrito cumprimento à Instrução Normativa nº 65/2021 e ao Art. 11 da Lei 14.133/2021, que realizei a curadoria pessoal das fontes acima listadas, atestando a similaridade técnica com o objeto pretendido e validando o cálculo estatístico como balizador do preço estimado aceitável para a referida contratação.
      </p>
      <br><br><br>
      <p style="text-align: center; font-family: Arial; font-size: 11pt;">
        ___________________________________________________<br>
        Assinatura do Agente Público Responsável
      </p>
    `;

    const sourceHTML = header + conteudo + footer;
    
    // A MÁGICA DO BLOB: Força o navegador a criar o arquivo físico na memória sem bloqueios de segurança
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    
    const fileDownload = document.createElement("a");
    fileDownload.href = url;
    fileDownload.download = 'Memoria_Calculo_IN65.doc';
    document.body.appendChild(fileDownload);
    fileDownload.click();
    
    // Limpeza da memória após o download
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-slate-200">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm">
          MÓDULO DE GOVERNANÇA: PESQUISA DE PREÇOS (IN 65/2021)
        </div>

        <nav className="mb-6 text-sm font-medium space-x-4 border-b pb-4">
          <Link href="/" className="text-slate-500 hover:text-indigo-600 transition-colors">← Voltar para Início</Link>
          <span className="text-indigo-700 font-bold">Fase 4: Pesquisa PNCP (Híbrida)</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-indigo-900">Pesquisa de Mercado Estruturada</h1>
          <p className="text-slate-500 text-sm">A máquina busca e calcula. O humano valida e atesta a similaridade.</p>
        </header>

        <form onSubmit={buscarPrecos} className="flex gap-4 mb-8">
          <input 
            type="text" 
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Ex: Notebook Core i7, 16GB RAM" 
            className="flex-1 p-4 border rounded-md outline-none focus:ring-2 focus:ring-indigo-500 text-lg shadow-sm"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-md transition-colors disabled:bg-slate-400 shadow-sm whitespace-nowrap"
          >
            {loading ? 'Consultando PNCP...' : '🔍 Buscar no PNCP'}
          </button>
        </form>

        {resultados.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-bold text-slate-800 border-b pb-2">Fontes Oficiais Encontradas ({resultados.length})</h2>
              <p className="text-xs text-slate-500 mb-4">Selecione no mínimo 3 fontes que sejam idênticas ao seu objeto para compor a cesta de preços.</p>
              
              <div className="space-y-3">
                {resultados.map((item) => (
                  <label key={item.id_compra} className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${selecionados.includes(item.id_compra) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 text-indigo-600"
                      checked={selecionados.includes(item.id_compra)}
                      onChange={() => toggleSelecao(item.id_compra)}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-800 text-sm">{item.orgao_comprador}</span>
                        <span className="font-bold text-indigo-700">{formatarMoeda(item.valor_unitario)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.descricao_item}</p>
                      <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-mono">
                        <span>ID: {item.id_compra}</span>
                        <span>Data: {item.data_publicacao}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="sticky top-8 bg-slate-800 rounded-xl p-6 text-white shadow-xl">
                <h3 className="font-bold text-indigo-300 border-b border-slate-600 pb-2 mb-4">📊 Cesta de Preços</h3>
                
                {estatisticas ? (
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center">
                      <span className="text-sm text-slate-300">Amostras Válidas:</span>
                      <span className="font-bold text-lg">{estatisticas.qtd}</span>
                    </div>
                    
                    <div className="bg-slate-700/50 p-3 rounded-md">
                      <span className="block text-xs text-slate-400 mb-1">Média Aritmética</span>
                      <span className="block font-mono text-xl">{formatarMoeda(estatisticas.media)}</span>
                    </div>

                    <div className="bg-indigo-600/30 border border-indigo-500 p-3 rounded-md">
                      <span className="block text-xs text-indigo-200 mb-1">Valor Estimado (Mediana IN 65)</span>
                      <span className="block font-mono font-bold text-2xl text-white">{formatarMoeda(estatisticas.mediana)}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-600 mt-4 text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between"><span>Menor:</span> <span>{formatarMoeda(estatisticas.menorPreco)}</span></div>
                      <div className="flex justify-between"><span>Maior:</span> <span>{formatarMoeda(estatisticas.maiorPreco)}</span></div>
                    </div>

                    <button 
                      onClick={exportarRelatorioWord}
                      disabled={estatisticas.qtd < 3}
                      className="w-full mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-md transition-colors disabled:bg-slate-600 disabled:text-slate-400 shadow-md"
                    >
                      {estatisticas.qtd < 3 ? 'Selecione min. 3 fontes' : '📄 Exportar Relatório Oficial'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Aguardando seleção humana.<br/>Nenhum cálculo realizado.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}