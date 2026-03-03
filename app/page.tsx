'use client';

import { useState, useEffect } from 'react';
import { licitacaoService } from '../services/licitacaoService';
import Link from 'next/link';

// ============================================================================
// COMPONENTE: CALCULADORA PARAMÉTRICA DO DFD (Obrigatório TCU - Eixo 1)
// ============================================================================
function CalculadoraDFD({ onCalculoCompleto }: { onCalculoCompleto: (qtd: number, memoria: string) => void }) {
  const [consumoMensal, setConsumoMensal] = useState('');
  const [meses, setMeses] = useState<number>(12);
  const [margem, setMargem] = useState<number>(10);
  const [quantidadeTotal, setQuantidadeTotal] = useState<number>(0);

  useEffect(() => {
    const base = Number(consumoMensal) || 0;
    const periodo = Number(meses) || 0;
    const margemSeguranca = Number(margem) || 0;
    
    // Fórmula Matemática: (Consumo * Meses) + Margem%
    const calculo = (base * periodo) * (1 + (margemSeguranca / 100));
    const totalArredondado = Math.ceil(calculo);
    
    setQuantidadeTotal(totalArredondado);

    // Texto de Blindagem Material que substituirá a justificativa genérica
    const memoriaDeCalculo = `MEMÓRIA DE CÁLCULO PARAMÉTRICA (ART. 18, LEI 14.133): Consumo histórico aferido de ${base} und/mês, projetado para o período contratual de ${periodo} meses, acrescido de margem de segurança técnica de ${margemSeguranca}% para mitigação de risco de desabastecimento. Quantidade exata e matematicamente fundamentada: ${totalArredondado} unidades.`;

    if (base > 0) {
      onCalculoCompleto(totalArredondado, memoriaDeCalculo);
    } else {
      onCalculoCompleto(0, '');
    }
  }, [consumoMensal, meses, margem]);

  return (
    <div className="p-5 border border-blue-200 rounded-md bg-slate-100 col-span-1 md:col-span-2 shadow-inner">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        🧮 Memória de Cálculo Paramétrica (Exigência Tribunal de Contas)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Consumo Médio (Mensal)</label>
          <input 
            type="number" 
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
            value={consumoMensal}
            onChange={(e) => setConsumoMensal(e.target.value)}
            placeholder="Ex: 50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Meses de Cobertura</label>
          <input 
            type="number" 
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
            value={meses}
            onChange={(e) => setMeses(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Margem Técnica (%)</label>
          <input 
            type="number" 
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
            value={margem}
            onChange={(e) => setMargem(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-600 text-white rounded-md flex justify-between items-center shadow-sm">
        <span className="font-bold">Quantidade Institucional Projetada:</span>
        <span className="text-2xl font-black tracking-tight">{quantidadeTotal} und</span>
      </div>
      <p className="text-xs text-slate-500 mt-3 font-medium">
        *A parametrização matemática afasta o risco de nulidade por estimativa arbitrária e atende à jurisprudência do TCU.
      </p>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function Home() {
  // === ESTADOS DO SETUP INSTITUCIONAL (IBGE) ===
  const [cidadeInput, setCidadeInput] = useState('');
  const [loadIbge, setLoadIbge] = useState(false);
  const [orgaoConfigurado, setOrgaoConfigurado] = useState<any>(null);

  // === ESTADOS DO DFD ===
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [origem, setOrigem] = useState('');
  const [impacto, setImpacto] = useState('');
  const [pca, setPca] = useState('Sim');
  const [numeroPca, setNumeroPca] = useState('');
  const [justificativaPca, setJustificativaPca] = useState('');
  
  // === ESTADOS DA CALCULADORA E MODAL ===
  const [quantidadeParametrizada, setQuantidadeParametrizada] = useState<number>(0);
  const [memoriaDeCalculoText, setMemoriaDeCalculoText] = useState<string>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [termoAceito, setTermoAceito] = useState(false);
  const [dadosFormulario, setDadosFormulario] = useState<FormData | null>(null);

  useEffect(() => {
    const orgaoSalvo = localStorage.getItem('licitacao_orgao_data');
    if (orgaoSalvo) setOrgaoConfigurado(JSON.parse(orgaoSalvo));
  }, []);

  const buscarDadosIbge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidadeInput) return;
    setLoadIbge(true);
    try {
      const info = await licitacaoService.buscarInfoOrgao(cidadeInput);
      setOrgaoConfigurado(info);
      localStorage.setItem('licitacao_orgao_data', JSON.stringify(info));
    } catch (error) {
      alert("Erro ao conectar com API do Censo.");
    } finally {
      setLoadIbge(false);
    }
  };

  const desvincularOrgao = () => {
    localStorage.removeItem('licitacao_orgao_data');
    setOrgaoConfigurado(null);
    setCidadeInput('');
  };

  const prepararEnvio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Trava de segurança: Se não preencheu a calculadora, bloqueia.
    if (quantidadeParametrizada === 0) {
      alert("Atenção: É obrigatório preencher a Memória de Cálculo Paramétrica.");
      return;
    }

    setDadosFormulario(new FormData(e.currentTarget));
    setModalAberto(true);
  };

  const executarEnvioBlindado = async () => {
    if (!dadosFormulario) return;
    
    setModalAberto(false);
    setLoading(true);
    setErro(null);

    // O payload une os dados do formulário e o texto gerado pela calculadora secreta
    const payload = {
      setor_requisitante: (dadosFormulario.get('setor') || '').toString(),
      objeto_da_compra: (dadosFormulario.get('objeto') || '').toString(),
      quantidade_estimada: quantidadeParametrizada, // Vem da Calculadora Matemática
      origem_necessidade: `${origem}. ${memoriaDeCalculoText}`, // Funde o motivo com a memória de cálculo
      impacto_institucional: impacto || 'Não selecionado',
      previsao_pca: pca,
      numero_pca: pca === 'Sim' ? numeroPca : '',
      justificativa_pca: pca === 'Não' ? justificativaPca : ''
    };

    try {
      const data = await licitacaoService.gerarDFD(payload);
      setResultado(data);

      let processId = localStorage.getItem('licitacao_id_processo');
      if (!processId) {
        processId = `PROC-${Date.now()}`;
        localStorage.setItem('licitacao_id_processo', processId);
      }

      const orgaoAtual = JSON.parse(localStorage.getItem('licitacao_orgao_data') || '{}');
      
      await licitacaoService.salvarNoBanco({
        id_processo: processId,
        cidade: orgaoAtual.cidade || 'Não Conectado',
        objeto: payload.objeto_da_compra,
        dados_completos: { fase_atual: 'DFD_CONCLUIDO', payload_dfd: payload },
        hash_auditoria: data.hash
      });

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
    const htmlText = resultado.texto_oficial.split('\n').map((line: string) => `<p style="font-family: Arial, sans-serif; font-size: 11pt; text-align: justify; line-height: 1.5; margin-bottom: 6px;">${line}</p>`).join('');
    const sourceHTML = header + htmlText + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    fileDownload.href = url;
    fileDownload.download = 'DFD_Oficial_Auditavel.doc';
    document.body.appendChild(fileDownload);
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900 relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* === SETUP INSTITUCIONAL (IBGE) === */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">🏛️ Conexão Institucional (Base Censo/IBGE)</h2>
          {!orgaoConfigurado ? (
            <form onSubmit={buscarDadosIbge} className="flex gap-4">
              <input 
                type="text" 
                value={cidadeInput} 
                onChange={(e) => setCidadeInput(e.target.value)} 
                placeholder="Digite o nome do Município (Ex: Bálsamo, São Paulo...)" 
                className="flex-1 p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" 
                required 
              />
              <button 
                type="submit" 
                disabled={loadIbge} 
                className="bg-slate-900 text-white font-bold px-6 py-3 rounded-md hover:bg-slate-800 transition-colors shadow-sm disabled:bg-slate-400"
              >
                {loadIbge ? 'Sincronizando...' : 'Conectar Órgão'}
              </button>
            </form>
          ) : (
            <div className={`p-4 rounded-md border flex justify-between items-center ${orgaoConfigurado.is_pequeno_porte ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <div>
                <strong className="block text-slate-800 text-lg">{orgaoConfigurado.cidade}</strong>
                <span className="text-sm text-slate-600">População Oficial: {orgaoConfigurado.populacao.toLocaleString('pt-BR')} habitantes</span>
                <span className={`block text-xs font-bold mt-1 ${orgaoConfigurado.is_pequeno_porte ? 'text-green-700' : 'text-blue-700'}`}>
                  Enquadramento Legal: {orgaoConfigurado.fundamentacao_legal}
                </span>
              </div>
              <button onClick={desvincularOrgao} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-bold text-slate-600 shadow-sm transition-colors">
                Alterar Órgão
              </button>
            </div>
          )}
        </div>

        {/* === DFD INTEGRAL RESTAURADO E BLINDADO === */}
        <div className={`bg-white rounded-lg shadow-xl p-8 border border-slate-200 transition-opacity duration-500 ${!orgaoConfigurado ? 'opacity-50 pointer-events-none grayscale-[30%]' : 'opacity-100'}`}>
          <div className="mb-6 bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono text-center tracking-wider">
            MÓDULO DE GOVERNANÇA E COMPLIANCE - LEI 14.133/2021
          </div>

          <nav className="mb-8 text-sm font-medium flex flex-wrap gap-2 border-b pb-4 border-slate-200 items-center">
            <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md shadow-sm">1. Módulo DFD</span>
            <Link href="/etp" className="text-slate-600 hover:text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">2. Módulo ETP →</Link>
            <Link href="/tr" className="text-slate-600 hover:text-green-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">3. Módulo TR →</Link>
            <Link href="/pesquisa" className="text-slate-600 hover:text-indigo-700 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all">4. Pesquisa PNCP →</Link>
            <Link href="/auditoria" className="ml-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-1.5 rounded-md transition-all font-bold">🛡️ Auditoria</Link>
          </nav>

          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Fase 1: Formalização de Demanda (DFD)</h1>
            <p className="text-slate-500 text-sm">Estruturação guiada para blindagem institucional com Hash Absoluto.</p>
          </header>
          
          <form onSubmit={prepararEnvio} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-semibold mb-1">Setor Requisitante</label>
                <input name="setor" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Secretaria de Saúde" />
              </div>
              
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-semibold mb-1">Objeto da Demanda</label>
                <input name="objeto" required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Aquisição de Veículos Utilitários" />
              </div>

              {/* INJEÇÃO DO NOVO MOTOR MATEMÁTICO (EIXO 1) AQUI */}
              <CalculadoraDFD 
                onCalculoCompleto={(qtd, memoria) => {
                  setQuantidadeParametrizada(qtd);
                  setMemoriaDeCalculoText(memoria);
                }} 
              />
            </div>

            <div className="flex flex-col p-5 bg-blue-50 border border-blue-200 rounded-md mt-6">
              <label className="text-sm font-bold text-slate-800 mb-3">Origem Técnica da Necessidade</label>
              <select required value={origem} onChange={(e) => setOrigem(e.target.value)} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="" disabled>Selecione o motivo fático...</option>
                <option value="Obsolescência tecnológica dos equipamentos atuais">Obsolescência dos equipamentos atuais</option>
                <option value="Aumento de demanda operacional do setor">Aumento de demanda operacional</option>
                <option value="Necessidade de adequação a nova exigência legal ou normativa">Adequação a nova exigência legal/normativa</option>
                <option value="Falhas frequentes e alto custo de manutenção do parque atual">Alto custo de manutenção do parque atual</option>
              </select>

              <label className="text-sm font-bold text-slate-800 mb-3 mt-4">Risco e Impacto Institucional da Não Contratação</label>
              <select required value={impacto} onChange={(e) => setImpacto(e.target.value)} className="p-3 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="" disabled>Selecione o principal risco...</option>
                <option value="Paralisação ou prejuízo direto ao atendimento ao cidadão">Prejuízo ao atendimento ao cidadão</option>
                <option value="Risco à segurança da informação e integridade dos dados governamentais">Risco à segurança da informação</option>
                <option value="Redução severa da eficiência e produtividade dos servidores">Redução de eficiência dos servidores</option>
                <option value="Descumprimento de metas estabelecidas no planejamento estratégico">Descumprimento de metas estratégicas</option>
              </select>
            </div>

            {/* O RESTANTE DO CÓDIGO DO PCA E BOTÕES SEGUE INTACTO ABAIXO */}
            <div className="flex flex-col p-5 bg-slate-50 border border-slate-300 rounded-md">
              <label className="text-sm font-bold text-slate-800 mb-2">A Contratação está prevista no PCA (Plano de Contratações Anual)?</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pca" value="Sim" checked={pca === 'Sim'} onChange={(e) => setPca(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold">Sim, prevista</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="pca" value="Não" checked={pca === 'Não'} onChange={(e) => setPca(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold">Não (Inclusão Superveniente)</span>
                </label>
              </div>

              {pca === 'Sim' ? (
                <div className="flex flex-col transition-all duration-300">
                  <label className="text-xs font-semibold mb-1 text-slate-600">Número/ID do Item no PCA</label>
                  <input value={numeroPca} onChange={(e) => setNumeroPca(e.target.value)} required className="p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Ex: Item 45 do PCA 2026" />
                </div>
              ) : (
                <div className="flex flex-col transition-all duration-300">
                  <label className="text-xs font-semibold mb-1 text-red-600">Justificativa Técnica para Inclusão Extraordinária (Fora do PCA)</label>
                  <textarea value={justificativaPca} onChange={(e) => setJustificativaPca(e.target.value)} required rows={2} className="p-3 border border-red-200 rounded-md outline-none focus:ring-2 focus:ring-red-500 bg-white" placeholder="Justifique a urgência ou determinação legal para esta inclusão..." />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-md">
              {loading ? 'Processando Lógica Institucional...' : 'Gerar DFD Auditável'}
            </button>
          </form>

          {erro && <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm whitespace-pre-wrap"><strong>Erro no Motor:</strong> {erro}</div>}
          
          {resultado && (
            <div className="mt-10 p-6 bg-slate-50 rounded-md border border-slate-300">
              <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-4">
                <h2 className="text-lg font-bold text-green-800">✅ DFD Gerado com Blindagem Institucional</h2>
                <button onClick={exportarParaWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow flex items-center gap-2 transition-colors">
                  📄 Exportar para Word
                </button>
              </div>
              <div className="bg-white p-6 rounded shadow-sm whitespace-pre-wrap text-sm leading-relaxed border border-slate-200 font-serif text-justify">
                {resultado.texto_oficial}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Assinatura de Responsabilidade</h3>
            <p className="text-sm text-slate-600 mb-4 text-justify">O processamento a seguir gravará as premissas matemáticas e fáticas na infraestrutura de nuvem com Hash imutável.</p>
            
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={termoAceito} 
                  onChange={(e) => setTermoAceito(e.target.checked)} 
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300" 
                />
                <span className="text-sm font-semibold text-slate-800 text-justify">
                  Declaro sob as penas da lei a veracidade das variáveis inseridas e autorizo a geração da Trilha Criptográfica.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
              <button onClick={executarEnvioBlindado} disabled={!termoAceito} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm">Confirmar e Assinar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}