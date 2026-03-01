'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { licitacaoService } from '../../services/licitacaoService';
import Link from 'next/link';

export default function Cadastro() {
  const [passo, setPasso] = useState(1);
  const [cidadeBusca, setCidadeBusca] = useState('');
  const [loadIbge, setLoadIbge] = useState(false);
  const [dadosOrgao, setDadosOrgao] = useState<any>(null);
  
  const [responsavel, setResponsavel] = useState('');
  const [senha, setSenha] = useState('');
  const [termoAceito, setTermoAceito] = useState(false);
  
  const router = useRouter();

  const buscarOrgao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadIbge(true);
    try {
      const info = await licitacaoService.buscarInfoOrgao(cidadeBusca);
      setDadosOrgao(info);
      setPasso(2);
    } catch (error) {
      alert("Erro ao localizar órgão.");
    } finally {
      setLoadIbge(false);
    }
  };

  const finalizarCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termoAceito) { alert("Você deve aceitar o Termo de Responsabilidade Legal."); return; }
    
    // Salva o Órgão e a Autenticação (Banco de Dados Simulado)
    const authPayload = {
      login: cidadeBusca,
      senha: senha,
      cidade: dadosOrgao.cidade,
      responsavel: responsavel,
      data_cadastro: new Date().toISOString()
    };
    
    localStorage.setItem('licitacao_auth', JSON.stringify(authPayload));
    localStorage.setItem('licitacao_orgao_data', JSON.stringify(dadosOrgao));
    
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-6 font-sans flex justify-center">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Ativação Institucional</h1>
          <p className="text-blue-100 mt-1 text-sm">Liberação de Licença Trial (30 Dias)</p>
        </div>

        <div className="p-8">
          {passo === 1 && (
            <form onSubmit={buscarOrgao} className="space-y-6 animate-fadeIn">
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 text-sm text-slate-300 mb-6">
                Conecte seu órgão público à base do Censo/IBGE para ativarmos automaticamente as regras de porte da Lei 14.133/21 (Art. 176).
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">CNPJ ou Nome do Município</label>
                <input type="text" value={cidadeBusca} onChange={(e) => setCidadeBusca(e.target.value)} required className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: São Paulo, Bálsamo..." />
              </div>
              <button type="submit" disabled={loadIbge} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-colors disabled:bg-slate-600">
                {loadIbge ? 'Sincronizando com IBGE...' : 'Avançar e Sincronizar Órgão'}
              </button>
            </form>
          )}

          {passo === 2 && dadosOrgao && (
            <form onSubmit={finalizarCadastro} className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-md border bg-blue-900/30 border-blue-500/30 flex justify-between items-center mb-6">
                <div>
                  <strong className="block text-white text-lg">🏛️ {dadosOrgao.cidade}</strong>
                  <span className="text-xs text-blue-300">População IBGE: {dadosOrgao.populacao.toLocaleString('pt-BR')} hab. | {dadosOrgao.fundamentacao_legal}</span>
                </div>
                <button type="button" onClick={() => setPasso(1)} className="text-xs text-slate-400 hover:text-white underline">Alterar</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nome do Responsável/Pregoeiro</label>
                  <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} required className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nome Completo" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Crie uma Senha Administrativa</label>
                  <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="••••••••" />
                </div>
              </div>

              {/* O TERMO DE RESPONSABILIDADE DE TITÂNIO */}
              <div className="mt-8 border border-slate-600 rounded-lg overflow-hidden">
                <div className="bg-slate-700 p-3 border-b border-slate-600">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-center">Termo de Responsabilidade Legal e Compliance</h3>
                </div>
                <div className="bg-slate-900 p-4 h-48 overflow-y-auto text-xs text-slate-400 leading-relaxed space-y-3 font-serif">
                  <p><strong>CLÁUSULA 1 (NATUREZA DA FERRAMENTA):</strong> A Plataforma GovTech-Engine atua exclusivamente como Infraestrutura de Apoio e Assistência Tecnológica à Fase Preparatória. O sistema NÃO substitui o juízo de valor, a discricionariedade técnica e a responsabilidade indelegável do gestor público signatário, conforme preceitua o Art. 11 da Lei 14.133/21.</p>
                  <p><strong>CLÁUSULA 2 (INTEGRIDADE E HASH WORM):</strong> O Órgão declara ciência de que a plataforma gera um Hash Criptográfico Absoluto (SHA-256) atrelando as decisões à linha do tempo processual. A plataforma garante a imutabilidade técnica do documento gerado contra adulterações sistêmicas posteriores, mas NÃO se responsabiliza civil ou penalmente por dados falsos, sobrepreços intencionais ou informações inverídicas digitadas ativamente pelo usuário na origem do formulário.</p>
                  <p><strong>CLÁUSULA 3 (ISENÇÃO DE RESPONSABILIDADE SOLIDÁRIA):</strong> Fica expressamente vedada e renunciada qualquer tese de responsabilização solidária da Desenvolvedora do Software por apontamentos, glosas, multas, rejeição de contas ou condenações impostas por Tribunais de Contas decorrentes do uso inadequado das matrizes (ETP/TR) geradas pela Contratante.</p>
                  <p><strong>CLÁUSULA 4 (DATA MOAT E INTELIGÊNCIA COLETIVA):</strong> O Órgão autoriza, de forma irrevogável, a coleta estritamente anonimizada de metadados estatísticos (volumes financeiros, tipologia de riscos mitigados e métodos TCO predominantes) para composição do banco de dados de inteligência de mercado da Plataforma, sendo plenamente garantido o sigilo absoluto de dados sensíveis e peças processuais em sigilo legal.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <input type="checkbox" checked={termoAceito} onChange={(e) => setTermoAceito(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-600" />
                <span className="text-sm font-medium text-slate-300">
                  Li, compreendi as limitações jurídicas e <strong className="text-white">ACEITO INTEGRALMENTE</strong> o Termo de Responsabilidade Legal para uso do sistema em nome do órgão público.
                </span>
              </label>

              <button type="submit" disabled={!termoAceito} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:text-slate-400 text-lg mt-6 shadow-lg shadow-green-600/20">
                Assinar Termo e Iniciar Trial de 30 Dias
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">← Voltar para a tela de Login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}