'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';
import { buildProcessPath } from '../../lib/processUrl';
import { runFullAnalysis } from '../../lib/pncpStatsEngine';
import { gerarRelatorioIN65Docx, downloadRelatorioIN65, type ResultadoPesquisaDoc } from '../../lib/pncpReportDocx';
import { LegalExplanationPanel } from '../../components/LegalExplanationPanel';
import { getEstruturaContratacao } from '../../lib/estruturaContratacao';

const KEY_RESULTADO_PESQUISA = 'licitacao_resultado_pesquisa';
const KEY_DOCUMENTO_IN65 = 'licitacao_documento_in65';

/** Item de pesquisa de preços para validação IN65 (fonte, valor, url). */
export type PesquisaItem = {
  fonte: string;
  valor: number;
  url?: string;
};

export default function PaginaPNCP() {
  const router = useRouter();
  
  // === ESTADOS DO SENSOR DE CAPTURA (INJEÇÃO V5.3) ===
  const [idProcesso, setIdProcesso] = useState<string | null>(null);
  const [regimeProcesso, setRegimeProcesso] = useState<string | null>(null);

  // === ESTADOS DE HERANÇA (REGRESSÃO ZERO) ===
  const [objetoPrincipal, setObjetoPrincipal] = useState('');
  const [isAgrupado, setIsAgrupado] = useState(false);
  const [itensParaPesquisar, setItensParaPesquisar] = useState<any[]>([]);
  const [itemAtivoIndex, setItemAtivoIndex] = useState(0);

  // === ESTADOS DE PESQUISA ===
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultadosDaBusca, setResultadosDaBusca] = useState<any[]>([]);
  
  // Dicionário para guardar as seleções de cada item do lote
  const [selecoesPorItem, setSelecoesPorItem] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = localStorage.getItem('licitacao_auth');
    if (!auth) {
      router.replace('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const idUrl = urlParams.get('id');
    const regimeUrl = urlParams.get('regime');

    if (idUrl) {
      setIdProcesso(idUrl);
      localStorage.setItem('licitacao_id_processo', idUrl);
    } else {
      const storedId = localStorage.getItem('licitacao_id_processo');
      if (storedId) setIdProcesso(storedId);
      else {
        router.replace('/novo?session=expired');
        return;
      }
    }

    if (regimeUrl) {
      setRegimeProcesso(regimeUrl);
      localStorage.setItem('licitacao_regime', regimeUrl);
    } else {
      const storedRegime = localStorage.getItem('licitacao_regime');
      if (storedRegime) setRegimeProcesso(storedRegime);
    }

    // 2. HERANÇA DO ETP/TR (motor de estrutura)
    const objetoSalvo = localStorage.getItem('licitacao_objeto');
    const estrutura = getEstruturaContratacao();

    if (objetoSalvo) {
      setObjetoPrincipal(objetoSalvo);
      if (estrutura.isAgrupado && estrutura.itens.length > 0) {
        setIsAgrupado(true);
        setItensParaPesquisar(estrutura.itens);
        setTermoBusca(estrutura.itens[0].nome);
      } else {
        setIsAgrupado(false);
        setItensParaPesquisar([{ nome: objetoSalvo, quantidade: 1, especificacao: '', unidade: 'unidade' }]);
        setTermoBusca(objetoSalvo);
      }
    }
  }, [router]);

  const itemAtivo = itensParaPesquisar[itemAtivoIndex];
  const selecionadosAtuais = selecoesPorItem[itemAtivoIndex] || [];

  const buscarPrecos = async (termo: string) => {
    if (!termo) return;
    setLoading(true);
    try {
      // Conexão com o AI Core (FastAPI)
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
    const valorCorrigido = precoItem.valor_unitario * 1.048;
    const itemModificado = { ...precoItem, valor_unitario: valorCorrigido, corrigidoIPCA: true };
    
    setResultadosDaBusca(resultadosDaBusca.map(r => r.id_compra === precoItem.id_compra ? itemModificado : r));
    
    if (selecionadosAtuais.find(s => s.id_compra === precoItem.id_compra)) {
      const novaSelecao = selecionadosAtuais.map(s => s.id_compra === precoItem.id_compra ? itemModificado : s);
      setSelecoesPorItem({ ...selecoesPorItem, [itemAtivoIndex]: novaSelecao });
    }
  };

  // === MOTOR DE ANÁLISE ESTATÍSTICA (IN 65/2021) ===
  const valoresSelecionados = useMemo(
    () => selecionadosAtuais.map((s) => s.valor_unitario),
    [selecionadosAtuais]
  );
  const analysis = useMemo(() => runFullAnalysis(valoresSelecionados), [valoresSelecionados]);

  // Compatibilidade: estatísticas e validade para fluxo (mín. 3 preços; após expurgo, mínimo 3 restantes)
  const estatisticas = useMemo(() => {
    const ref = analysis.afterOutlierRemoval ?? analysis.raw;
    const valid =
      analysis.raw.count >= 3 &&
      (!analysis.hadOutliers || (analysis.afterOutlierRemoval?.valid ?? false));
    return {
      media: ref.mean,
      dp: ref.standardDeviation,
      cv: ref.coefficientOfVariation,
      valid,
      referencePrice: analysis.referencePrice,
    };
  }, [analysis]);

  // Valores efetivamente usados no cálculo do preço de referência (após expurgo de outliers, se houver)
  const valoresUsadosNoPrecoReferencia = useMemo(() => {
    if (analysis.hadOutliers && analysis.iqr?.valuesWithoutOutliers?.length) {
      return analysis.iqr.valuesWithoutOutliers;
    }
    return valoresSelecionados;
  }, [analysis.hadOutliers, analysis.iqr?.valuesWithoutOutliers, valoresSelecionados]);

  // Análise de desvio: preço de referência (IN 65) vs valor estimado (média simples das amostras)
  const analiseDesvio = useMemo(() => {
    if (analysis.raw.count < 2 || analysis.raw.mean <= 0) return null;
    const valorEstimado = analysis.raw.mean;
    const valorReferencia = analysis.referencePrice;
    const desvio = (valorReferencia - valorEstimado) / valorEstimado;
    const desvioPercentual = desvio * 100;
    const sobreprecoAlerta = desvio > 0.30;
    return { valorEstimado, valorReferencia, desvio, desvioPercentual, sobreprecoAlerta };
  }, [analysis.raw.count, analysis.raw.mean, analysis.referencePrice]);

  const avancarParaProximoItem = () => {
    if (!estatisticas.valid) {
      alert("É necessário selecionar pelo menos 3 preços para cada item, conforme orientação do Tribunal de Contas.");
      return;
    }
    if (analysis.raw.count >= 3 && analysis.cvCompliance) {
      console.log('[PNCP_ITEM_VALIDADO]');
    }
    if (itemAtivoIndex < itensParaPesquisar.length - 1) {
      const proximoIndice = itemAtivoIndex + 1;
      setItemAtivoIndex(proximoIndice);
      setTermoBusca(itensParaPesquisar[proximoIndice].nome);
      setResultadosDaBusca([]);
    } else {
      salvarEConcluir();
    }
  };

  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const gerarRelatorio = async () => {
    setGerandoRelatorio(true);
    try {
      const orgaoData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('licitacao_orgao_data') || '{}') : {};
      let resultadoPesquisa: ResultadoPesquisaDoc | undefined;
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(KEY_RESULTADO_PESQUISA) : null;
        if (raw) resultadoPesquisa = JSON.parse(raw) as ResultadoPesquisaDoc;
      } catch {
        // ignora JSON inválido
      }
      const dados = {
        objetoContratacao: objetoPrincipal,
        idProcesso: idProcesso ?? undefined,
        regime: regimeProcesso ?? undefined,
        municipio: orgaoData.cidade ?? undefined,
        itens: itensParaPesquisar,
        selecoesPorItem,
        estruturaContratacao: getEstruturaContratacao(),
        resultadoPesquisa,
      };
      const blob = await gerarRelatorioIN65Docx(dados);
      downloadRelatorioIN65(blob);
    } catch (err) {
      console.error('Erro ao gerar relatório', err);
      alert('Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const salvarEConcluir = async () => {
    if (estatisticas.cv > 25) {
      const confirmar = window.confirm("Os preços deste item estão muito diferentes entre si. O Tribunal de Contas recomenda ajustar (remover valores extremos) antes de concluir. Deseja mesmo prosseguir?");
      if (!confirmar) return;
    }

    const itensResultado: { nome: string; quantidade: number; valorItem: number; mediaReferencia: number; selecoes: PesquisaItem[] }[] = [];
    let valorGlobal = 0;

    itensParaPesquisar.forEach((item, index) => {
      const sel = selecoesPorItem[index] || [];
      const vals = sel.map((s) => s.valor_unitario);
      const refPrice = index === itemAtivoIndex ? analysis.referencePrice : (vals.length ? runFullAnalysis(vals).referencePrice : 0);
      const quantidade = item.quantidade ?? 1;
      const valorItem = refPrice * quantidade;
      valorGlobal += valorItem;

      const selecoes: PesquisaItem[] = sel.map((s) => ({
        fonte: s.orgao_comprador ?? '',
        valor: s.valor_unitario ?? 0,
        url: s.link ?? s.url,
      }));

      itensResultado.push({
        nome: item.nome ?? '',
        quantidade,
        valorItem,
        mediaReferencia: refPrice,
        selecoes,
      });
    });

    console.log('[PNCP_VALOR_GLOBAL]', valorGlobal);

    const resultadoPesquisa = {
      valorGlobal,
      itens: itensResultado,
      validacaoIN65: { minimoPrecos: 3, cvMaximoPercentual: 25 },
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_RESULTADO_PESQUISA, JSON.stringify(resultadoPesquisa));
    }

    localStorage.setItem('licitacao_pncp_concluido', 'true');
    localStorage.setItem('licitacao_valor_estimado', valorGlobal.toString());

    // Gerar documento IN65 e salvar referência no localStorage
    try {
      const orgaoData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('licitacao_orgao_data') || '{}') : {};
      const dados = {
        objetoContratacao: objetoPrincipal,
        idProcesso: idProcesso ?? undefined,
        regime: regimeProcesso ?? undefined,
        municipio: orgaoData.cidade ?? undefined,
        itens: itensParaPesquisar,
        selecoesPorItem,
        estruturaContratacao: getEstruturaContratacao(),
        resultadoPesquisa,
      };
      await gerarRelatorioIN65Docx(dados);
      const refIn65 = {
        generatedAt: new Date().toISOString(),
        valorGlobal,
        idProcesso: idProcesso ?? undefined,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEY_DOCUMENTO_IN65, JSON.stringify(refIn65));
      }
      console.log('[IN65_FINAL_GERADO]');
    } catch (err) {
      console.error('Erro ao gerar referência IN65:', err);
    }

    // INJEÇÃO V5.3: Amarração Final no Banco de Dados
    try {
      const processId = idProcesso || localStorage.getItem('licitacao_id_processo');
      const orgaoAtual = JSON.parse(localStorage.getItem('licitacao_orgao_data') || '{}');

      if (processId) {
        await licitacaoService.salvarNoBanco({
          id_processo: processId,
          cidade: orgaoAtual.cidade || 'Não Conectado',
          objeto: objetoPrincipal,
          dados_completos: { 
            fase_atual: 'PESQUISA_CONCLUIDA', 
            valor_global_homologado: valorGlobal,
            cesta_precos: selecoesPorItem 
          },
          hash_auditoria: `PNCP-IN65-${Date.now()}`
        });
      }
    } catch (error) {
      console.error("Aviso: Falha ao salvar no banco, mas processo local mantido.", error);
    }

    alert("Pesquisa de preços concluída. Valor estimado global: R$ " + valorGlobal.toFixed(2).replace('.', ','));
    console.log('[NAVIGATION TRIGGER] /processos', 'PNCP concluir pesquisa');
    router.push('/processos');
  };

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Top bar institucional */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="border-b border-slate-200 pb-4 sm:pb-0 sm:border-0">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pesquisa de Preços — PNCP</h1>
            <p className="text-sm text-slate-500 mt-0.5">Pesquisa de preços conforme orientações do Tribunal de Contas</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-medium">
            <Link href={buildProcessPath('/dfd', idProcesso, regimeProcesso)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">1. DFD</Link>
            <Link href={buildProcessPath('/etp', idProcesso, regimeProcesso)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">2. ETP</Link>
            <Link href={buildProcessPath('/tr', idProcesso, regimeProcesso)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">3. TR</Link>
            <span className="bg-slate-800 text-white px-3 py-2 rounded-lg font-semibold">4. PNCP</span>
            <Link href="/auditoria" className="text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors font-semibold">Auditoria</Link>
          </nav>
        </div>

        {/* Contexto do processo */}
        {idProcesso && (
          <div className="mb-6 rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Processo</span>
                <span className="font-mono font-bold text-slate-800">{idProcesso}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Regime</span>
                <span className="font-semibold text-slate-700">{regimeProcesso || 'Licitação padrão'}</span>
              </div>
              {isAgrupado && (
                <>
                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Item</span>
                    <span className="font-semibold text-slate-700">{itemAtivoIndex + 1} de {itensParaPesquisar.length}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: 1. Resultados de preços */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-mono text-sm">1</span>
                  Resultados de preços
                </h2>
                <p className="text-xs text-slate-500 mt-1">Consulta PNCP · Selecione os preços para inclusão na análise</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Objeto / termo de busca</label>
                  <div className="flex gap-3">
                    <input
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
                      placeholder="Ex.: material de escritório"
                    />
                    <button
                      onClick={() => buscarPrecos(termoBusca)}
                      disabled={loading}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
                    >
                      {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{itemAtivo?.nome && `Item atual: ${itemAtivo.nome}`}</p>
                </div>

                {resultadosDaBusca.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 mb-3">Selecione na tabela os preços que comporão a análise (mín. 3).</p>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-700 w-12">Incluir</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Fonte (órgão)</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Descrição</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Preço unit.</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Data</th>
                            <th className="w-20 py-3 px-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {resultadosDaBusca.map((item, index) => {
                            const isSelected = selecionadosAtuais.some((s) => s.id_compra === item.id_compra);
                            return (
                              <tr
                                key={item.id_compra ?? index}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleSelecao(item)}
                                onKeyDown={(e) => e.key === 'Enter' && toggleSelecao(item)}
                                className={`border-b border-slate-100 last:border-0 transition-colors ${isSelected ? 'bg-emerald-50/70 hover:bg-emerald-100/70' : 'hover:bg-slate-50'}`}
                              >
                                <td className="py-3 px-4">
                                  <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 rounded border-slate-300 text-emerald-600 pointer-events-none" aria-hidden />
                                </td>
                                <td className="py-3 px-4 text-slate-800 max-w-[160px] truncate" title={item.orgao_comprador}>{item.orgao_comprador || '—'}</td>
                                <td className="py-3 px-4 text-slate-800 max-w-[220px]" title={item.descricao_item}><span className="line-clamp-2">{item.descricao_item || '—'}</span></td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">R$ {item.valor_unitario.toFixed(2).replace('.', ',')}{item.corrigidoIPCA && <span className="block text-[10px] text-amber-600 font-normal">IPCA</span>}</td>
                                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.data_publicacao || '—'}</td>
                                <td className="py-3 px-2">
                                  {!item.corrigidoIPCA && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); aplicarCorrecaoIPCA(item); }} className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold py-1.5 px-2 rounded border border-amber-200">IPCA</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Coluna direita: 2. Análise | 3. Conformidade | 4. Documentação */}
          <div className="space-y-6">
            {/* 2. Análise estatística */}
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-mono text-sm">2</span>
                  Análise estatística
                </h2>
                <p className="text-xs text-slate-500 mt-1">Resumo dos preços selecionados e preço de referência</p>
              </div>
              <div className="p-6 space-y-4">
                <div className={`flex justify-between items-center rounded-lg px-4 py-3 border ${analysis.raw.count >= 3 ? 'bg-emerald-50 border-emerald-200' : analysis.raw.count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-sm font-medium text-slate-600">Preços selecionados</span>
                  <span className={`font-bold ${analysis.raw.count >= 3 ? 'text-emerald-700' : analysis.raw.count > 0 ? 'text-amber-700' : 'text-slate-500'}`}>{analysis.raw.count} de 3 (mínimo)</span>
                </div>
                {analysis.raw.count >= 3 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Média (R$)</span>
                        <span className="font-mono font-bold text-slate-800">{analysis.raw.mean.toFixed(2)}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Preço do meio (mediana) R$</span>
                        <span className="font-mono font-bold text-slate-800">{analysis.raw.median.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Diferença entre preços (R$)</span>
                      <span className="font-mono font-bold text-slate-800">{analysis.raw.standardDeviation.toFixed(2)}</span>
                    </div>
                    <div className={`rounded-lg px-4 py-3 border ${analysis.cvCompliance ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">Variação dos preços</span>
                      <span className={`font-mono font-bold text-lg ${analysis.cvCompliance ? 'text-emerald-700' : 'text-red-700'}`}>{analysis.raw.coefficientOfVariation.toFixed(2)}%</span>
                      <span className={`text-xs mt-0.5 block ${analysis.cvCompliance ? 'text-emerald-600' : 'text-red-600'}`}>{analysis.cvCompliance ? 'Preços parecidos (até 25%)' : 'Preços muito diferentes (acima de 25%)'}</span>
                    </div>
                    {analysis.iqr && analysis.hadOutliers && (
                      <div className="rounded-lg bg-slate-100 border border-slate-200 p-3 text-xs text-slate-700">
                        <span className="font-semibold block mb-1">Valores extremos removidos</span>
                        {analysis.iqr.outliers.length} preço(s) muito alto(s) ou baixo(s) foi(foram) desconsiderado(s). Restaram {analysis.afterOutlierRemoval?.count} preços para calcular o valor de referência (variação {analysis.afterOutlierRemoval?.coefficientOfVariation.toFixed(2)}%).
                      </div>
                    )}
                    {valoresUsadosNoPrecoReferencia.length > 0 && (
                      <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
                        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Preços usados no cálculo final</span>
                        <ul className="space-y-1 text-sm font-mono text-slate-800">
                          {valoresUsadosNoPrecoReferencia.map((v, i) => (
                            <li key={i} className="flex justify-between"><span>Amostra {i + 1}</span><span className="font-semibold text-emerald-800">R$ {v.toFixed(2).replace('.', ',')}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="rounded-xl bg-slate-800 text-white p-4 text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Preço de referência final</span>
                      <span className="text-xl font-bold text-emerald-400 block mt-0.5">R$ {analysis.referencePrice.toFixed(2).replace('.', ',')}</span>
                      {isAgrupado && itemAtivo && <span className="text-xs text-slate-500 block mt-1">Item: R$ {(analysis.referencePrice * (itemAtivo.quantidade || 1)).toFixed(2).replace('.', ',')}</span>}
                    </div>

                    {analiseDesvio && (
                      <div className={`rounded-lg border p-4 ${analiseDesvio.sobreprecoAlerta ? 'bg-red-50 border-red-300' : 'bg-slate-100 border-slate-200'}`}>
                        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">Análise de desvio de preço</span>
                        <p className="text-xs text-slate-500 mb-2">Comparação entre valor estimado da contratação e preço de referência (IN 65/2021) para mitigar riscos.</p>
                        <div className="text-sm text-slate-700 space-y-1">
                          <p>Valor estimado (média das amostras): R$ {analiseDesvio.valorEstimado.toFixed(2).replace('.', ',')}</p>
                          <p>Preço de referência estatístico (IN 65): R$ {analiseDesvio.valorReferencia.toFixed(2).replace('.', ',')}</p>
                          <p className={`font-bold ${analiseDesvio.sobreprecoAlerta ? 'text-red-700' : 'text-slate-800'}`}>
                            Desvio: {analiseDesvio.desvioPercentual >= 0 ? '+' : ''}{analiseDesvio.desvioPercentual.toFixed(2)}%
                          </p>
                        </div>
                        {analiseDesvio.sobreprecoAlerta && (
                          <p className="text-sm font-bold text-red-800 mt-2 pt-2 border-t border-red-200">
                            Possível sobrepreço identificado com base na análise estatística da IN 65/2021.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* 3. Alertas de conformidade */}
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-mono text-sm">3</span>
                  Avisos da pesquisa
                </h2>
                <p className="text-xs text-slate-500 mt-1">Orientações do Tribunal de Contas</p>
              </div>
              <div className="p-6 space-y-4">
                {analysis.raw.count > 0 && analysis.raw.count < 3 && (
                  <div className="rounded-lg bg-amber-50 border-2 border-amber-400 p-4">
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1"><span aria-hidden>⚠️</span> Poucos preços selecionados</p>
                    <p className="text-sm text-amber-800 leading-relaxed">É necessário escolher <strong>pelo menos 3 preços</strong> na tabela para o sistema calcular o valor de referência.</p>
                    <p className="text-xs text-amber-700 mt-2 font-medium">Selecionados: {analysis.raw.count} de 3</p>
                  </div>
                )}
                {analysis.raw.count >= 3 && estatisticas.valid && analysis.cvCompliance && (
                  <>
                    <div className="rounded-lg bg-emerald-50 border-2 border-emerald-300 p-4 flex items-center gap-2">
                      <span className="text-emerald-600 font-bold text-sm">✓ Pesquisa válida: preços suficientes e variação aceitável</span>
                    </div>
                    <LegalExplanationPanel variant="pesquisa_precos_valida" className="mt-2" />
                  </>
                )}
                {analysis.raw.count >= 3 && !analysis.cvCompliance && analysis.cvAlertMessage && (
                  <div className="rounded-lg bg-red-50 border-2 border-red-400 p-4">
                    <p className="text-sm font-bold text-red-800 flex items-center gap-2 mb-1"><span aria-hidden>🚨</span> Atenção: preços muito diferentes</p>
                    <p className="text-sm text-red-800 leading-relaxed">{analysis.cvAlertMessage}</p>
                    <p className="text-xs text-red-700 mt-2 font-medium">Remova valores muito altos ou baixos ou inclua mais fontes de preço.</p>
                  </div>
                )}
                {analiseDesvio?.sobreprecoAlerta && (
                  <div className="rounded-lg bg-red-50 border-2 border-red-400 p-4">
                    <p className="text-sm font-bold text-red-800 flex items-center gap-2 mb-1"><span aria-hidden>⚠️</span> Possível sobrepreço</p>
                    <p className="text-sm text-red-800 leading-relaxed">
                      Possível sobrepreço identificado com base na análise estatística da IN 65/2021.
                    </p>
                    <p className="text-xs text-red-700 mt-2 font-medium">Desvio: +{analiseDesvio.desvioPercentual.toFixed(2)}% (acima de 30% indica risco à contratação).</p>
                  </div>
                )}
                {analysis.raw.count === 0 && (
                  <p className="text-sm text-slate-500 italic">Selecione preços na tabela para ver se a pesquisa está adequada.</p>
                )}
              </div>
            </section>

            {/* 4. Documentação e conclusão */}
            <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-mono text-sm">4</span>
                  Documentação e conclusão
                </h2>
                <p className="text-xs text-slate-500 mt-1">Gerar relatório e concluir pesquisa</p>
              </div>
              <div className="p-6 space-y-4">
                {!estatisticas.valid && analysis.raw.count > 0 && (
                  <p className="text-xs text-amber-700 font-medium">
                    {analysis.raw.count < 3 ? 'Selecione pelo menos 3 preços para poder concluir.' : 'Remova valores extremos ou inclua mais preços para que a variação fique aceitável (até 25%).'}
                  </p>
                )}
                <button
                  type="button"
                  onClick={gerarRelatorio}
                  disabled={gerandoRelatorio}
                  className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-400 text-white font-semibold py-3 text-sm transition-colors"
                >
                  {gerandoRelatorio ? 'Gerando...' : 'Gerar relatório de pesquisa (.docx)'}
                </button>
                <button
                  onClick={avancarParaProximoItem}
                  disabled={!estatisticas.valid}
                  className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3.5 text-sm transition-colors shadow-sm"
                >
                  {itemAtivoIndex < itensParaPesquisar.length - 1 ? 'Salvar item e avançar →' : 'Assinar pesquisa e concluir'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}