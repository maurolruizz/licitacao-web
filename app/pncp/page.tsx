'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function PaginaPNCP() {
  const router = useRouter();
  
  // === ESTADOS DE HERANÇA (REGRESSÃO ZERO) ===
  const [objetoPrincipal, setObjetoPrincipal] = useState('');
  const [isAgrupado, setIsAgrupado] = useState(false);
  const [itensParaPesquisar, setItensParaPesquisar] = useState<any[]>([]);
  const [itemAtivoIndex, setItemAtivoIndex] = useState(0);

  // === ESTADOS DE PESQUISA ===
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultadosDaBusca, setResultadosDaBusca] = useState<any[]>([]);
  
  // Dicionário para guardar as seleções de cada item do lote: { index: [selecionados] }
  const [selecoesPorItem, setSelecoesPorItem] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const objetoSalvo = localStorage.getItem('licitacao_objeto');
    const isAgrupadoSalvo = localStorage.getItem('licitacao_is_agrupado') === 'true';
    const itensLoteSalvo = localStorage.getItem('licitacao_itens_lote');

    if (objetoSalvo) {
      setObjetoPrincipal(objetoSalvo);
      
      if (isAgrupadoSalvo && itensLoteSalvo) {
        setIsAgrupado(true);
        const parseados = JSON.parse(itensLoteSalvo);
        setItensParaPesquisar(parseados);
        setTermoBusca(parseados[0].nome);
      } else {
        setIsAgrupado(false);
        setItensParaPesquisar([{ nome: objetoSalvo, quantidade: 1, especificacao: '' }]);
        setTermoBusca(objetoSalvo);
      }
    }
  }, []);

  const itemAtivo = itensParaPesquisar[itemAtivoIndex];
  const selecionadosAtuais = selecoesPorItem[itemAtivoIndex] || [];

  const buscarPrecos = async (termo: string) => {
    if (!termo) return;
    setLoading(true);
    try {
      const data = await licitacaoService.pesquisarPNCP(termo);
      if (data.resultados) {
        setResultadosDaBusca(data.resultados);
      }
    } catch (error) {
      console.error("Erro ao buscar PNCP", error);
      alert("Erro ao conectar com a base de preços.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecao = (precoItem: any) => {
    const jaSelecionado = selecionadosAtuais.find(s => s.id_compra === precoItem.id_compra);
    let novaSelecao;
    if (jaSelecionado) {
      novaSelecao = selecionadosAtuais.filter(s => s.id_compra !== precoItem.id_compra);
    } else {
      novaSelecao = [...selecionadosAtuais, precoItem];
    }
    setSelecoesPorItem({ ...selecoesPorItem, [itemAtivoIndex]: novaSelecao });
  };

  const aplicarCorrecaoIPCA = (precoItem: any) => {
    // Simulação de Correção Monetária IN 65 (Ex: +4.8% para base de preços antiga)
    const valorCorrigido = precoItem.valor_unitario * 1.048;
    const itemModificado = { ...precoItem, valor_unitario: valorCorrigido, corrigidoIPCA: true };
    
    // Atualiza nos resultados da busca
    setResultadosDaBusca(resultadosDaBusca.map(r => r.id_compra === precoItem.id_compra ? itemModificado : r));
    
    // Atualiza nos selecionados se estiver lá
    if (selecionadosAtuais.find(s => s.id_compra === precoItem.id_compra)) {
      const novaSelecao = selecionadosAtuais.map(s => s.id_compra === precoItem.id_compra ? itemModificado : s);
      setSelecoesPorItem({ ...selecoesPorItem, [itemAtivoIndex]: novaSelecao });
    }
  };

  // === MATEMÁTICA DE GOVERNANÇA (IN 65/2021) ===
  const estatisticas = useMemo(() => {
    const n = selecionadosAtuais.length;
    if (n === 0) return { media: 0, dp: 0, cv: 0, valid: false };
    
    const soma = selecionadosAtuais.reduce((acc, curr) => acc + curr.valor_unitario, 0);
    const media = soma / n;
    
    if (n === 1) return { media, dp: 0, cv: 0, valid: false };

    // Variância Amostral
    const somaDosQuadrados = selecionadosAtuais.reduce((acc, curr) => acc + Math.pow(curr.valor_unitario - media, 2), 0);
    const variancia = somaDosQuadrados / (n - 1);
    const dp = Math.sqrt(variancia);
    
    // Coeficiente de Variação (CV)
    const cv = (dp / media) * 100;
    
    return { media, dp, cv, valid: n >= 3 };
  }, [selecionadosAtuais]);

  const avancarParaProximoItem = () => {
    if (!estatisticas.valid) {
      alert("A IN 65 exige no mínimo 3 preços válidos para o balizamento de cada item.");
      return;
    }
    if (itemAtivoIndex < itensParaPesquisar.length - 1) {
      const proximoIndice = itemAtivoIndex + 1;
      setItemAtivoIndex(proximoIndice);
      setTermoBusca(itensParaPesquisar[proximoIndice].nome);
      setResultadosDaBusca([]); // Limpa a busca para o próximo item
    } else {
      // Concluiu todos os itens
      salvarEConcluir();
    }
  };

  const salvarEConcluir = () => {
    if (estatisticas.cv > 25) {
      const confirmar = window.confirm("O Coeficiente de Variação (CV) do último item está acima de 25%, o que contraria a recomendação do TCU. Deseja prosseguir mesmo assim (assumindo o risco)?");
      if (!confirmar) return;
    }
    
    // Consolida o Valor Global
    let valorGlobal = 0;
    itensParaPesquisar.forEach((item, index) => {
      const sel = selecoesPorItem[index] || [];
      const med = sel.reduce((a, b) => a + b.valor_unitario, 0) / (sel.length || 1);
      valorGlobal += med * item.quantidade;
    });

    localStorage.setItem('licitacao_pncp_concluido', 'true');
    localStorage.setItem('licitacao_valor_estimado', valorGlobal.toString());
    
    alert("✅ Análise IN 65 concluída! Valor Estimado Global: R$ " + valorGlobal.toFixed(2).replace('.', ','));
    router.push('/processos');
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 pb-20">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider shadow-sm">
          MÓDULO DE GOVERNANÇA E COMPLIANCE - IN 65 (BALIZAMENTO E SANEAMENTO)
        </div>

        <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-200 items-center">
          <Link href="/" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 1. DFD</Link>
          <Link href="/etp" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 2. ETP</Link>
          <Link href="/tr" className="text-slate-600 hover:text-green-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">← 3. TR</Link>
          <span className="text-purple-800 font-bold bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-md shadow-sm">4. PNCP (Saneamento)</span>
          <Link href="/auditoria" className="ml-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-1.5 rounded-md transition-all font-bold">🛡️ Auditoria</Link>
        </nav>

        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-purple-900">Saneamento de Preços (IN 65/2021)</h1>
            <p className="text-slate-500 text-sm mt-1">Busca no PNCP, Análise de Dispersão (CV) e Expurgo de Outliers.</p>
          </div>
          {isAgrupado && (
            <div className="bg-purple-100 text-purple-800 font-bold px-4 py-2 rounded-lg border border-purple-200 text-sm shadow-sm">
              Pesquisando Item {itemAtivoIndex + 1} de {itensParaPesquisar.length}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: BUSCA E RESULTADOS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col mb-4 border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-md">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Alvo da Pesquisa (Integrado ao TR)</span>
                <span className="text-lg font-bold text-slate-800">{itemAtivo?.nome}</span>
                {itemAtivo?.especificacao && <span className="text-xs text-slate-500">{itemAtivo.especificacao}</span>}
              </div>

              <div className="flex items-end gap-4 mt-6">
                <div className="flex-1">
                  <label className="text-sm font-bold text-slate-800 mb-2 block">Parâmetro de Busca (PNCP / Banco de Preços)</label>
                  <input value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full p-3 border border-slate-300 rounded-md outline-none bg-white focus:ring-2 focus:ring-purple-500 text-sm" placeholder="Refine o termo de busca..." />
                </div>
                <button onClick={() => buscarPrecos(termoBusca)} disabled={loading} className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-md transition-colors shadow-sm text-sm">
                  {loading ? 'Consultando...' : '🔍 Buscar Bases'}
                </button>
              </div>
            </div>

            {resultadosDaBusca.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider border-b pb-2">Parâmetros Encontrados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resultadosDaBusca.map((item, index) => {
                    const isSelected = selecionadosAtuais.find(s => s.id_compra === item.id_compra);
                    return (
                      <div key={index} className={`p-4 rounded-lg border transition-all relative ${isSelected ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-600' : 'border-slate-200 bg-white hover:border-purple-300'}`}>
                        <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => toggleSelecao(item)}>
                          <span className="text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded">{item.id_compra}</span>
                          <input type="checkbox" checked={!!isSelected} readOnly className="w-5 h-5 text-purple-600 rounded border-slate-300 pointer-events-none" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1 leading-tight">{item.descricao_item}</p>
                        <p className="text-[11px] text-slate-500 mb-3">{item.orgao_comprador} | <span className="font-semibold">{item.data_publicacao}</span></p>
                        
                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-200/60">
                          <div>
                            {item.corrigidoIPCA && <span className="block text-[10px] text-orange-600 font-bold mb-1">CORRIGIDO IPCA (+4.8%)</span>}
                            <span className="text-lg font-bold text-green-700">R$ {item.valor_unitario.toFixed(2).replace('.', ',')}</span>
                          </div>
                          {!item.corrigidoIPCA && (
                            <button onClick={(e) => { e.stopPropagation(); aplicarCorrecaoIPCA(item); }} className="text-[10px] bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-1.5 px-3 rounded transition-colors border border-orange-200">
                              📈 Aplicar IPCA
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: MATEMÁTICA E GOVERNANÇA */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 text-white sticky top-6">
              <h3 className="font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
                <span>🧮</span> Motor Matemático IN 65
              </h3>
              
              <div className="space-y-4 text-sm font-mono">
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded">
                  <span className="text-slate-400">Amostras Válidas:</span>
                  <span className={`font-bold text-lg ${estatisticas.valid ? 'text-green-400' : 'text-red-400'}`}>{selecionadosAtuais.length} <span className="text-xs text-slate-500 font-sans">/ Mín. 3</span></span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded">
                  <span className="text-slate-400">Desvio Padrão (R$):</span>
                  <span className="font-bold text-slate-200">{estatisticas.dp.toFixed(2)}</span>
                </div>

                <div className={`flex justify-between items-center p-3 rounded border ${estatisticas.cv > 25 ? 'bg-red-900/50 border-red-500' : 'bg-slate-800 border-slate-800'}`}>
                  <span className="text-slate-400">Coeficiente Var. (CV):</span>
                  <span className={`font-bold text-lg ${estatisticas.cv > 25 ? 'text-red-400' : 'text-blue-400'}`}>{estatisticas.cv.toFixed(2)}%</span>
                </div>
              </div>

              {estatisticas.cv > 25 && (
                <div className="mt-4 p-3 bg-red-950/80 border border-red-800 rounded-md text-xs text-red-200 leading-relaxed text-justify">
                  ⚠️ <strong>ALERTA TCU:</strong> CV superior a 25% indica alta dispersão. Recomenda-se o expurgo do valor extremo (outlier) para evitar distorção do preço estimado e apontamento de sobrepreço.
                </div>
              )}

              <div className="mt-8 border-t border-slate-700 pt-6">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider text-center">Valor Unitário Saneado (Média)</p>
                <p className="text-3xl font-bold text-center text-green-400">R$ {estatisticas.media.toFixed(2).replace('.', ',')}</p>
                {isAgrupado && (
                  <p className="text-center text-xs text-slate-500 mt-2">Valor Total do Item: R$ {(estatisticas.media * itemAtivo.quantidade).toFixed(2).replace('.', ',')}</p>
                )}
              </div>

              <div className="mt-8">
                <button 
                  onClick={avancarParaProximoItem}
                  disabled={!estatisticas.valid}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-lg transition-all shadow-md text-sm uppercase tracking-wider"
                >
                  {itemAtivoIndex < itensParaPesquisar.length - 1 ? 'Salvar Item e Avançar →' : 'Assinar Pesquisa e Concluir ✓'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}