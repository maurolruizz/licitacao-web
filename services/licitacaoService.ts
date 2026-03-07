// 🟢 CONEXÃO DEFINITIVA COM A NUVEM
// Hardcode da URL do Render para garantir que a Vercel nunca tente acessar o localhost.
const API_URL = 'https://licitacao-ai-core.onrender.com/api/v1';
const API_URL_V2 = 'https://licitacao-ai-core.onrender.com/api/v2';

export const licitacaoService = {
  // GERAÇÃO DE DOCUMENTOS (V1)
  gerarDFD: async (dados: any) => {
    const response = await fetch(`${API_URL}/gerar-dfd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!response.ok) throw new Error('Erro ao gerar DFD');
    return response.json();
  },
  
  gerarETP: async (dados: any) => {
    const response = await fetch(`${API_URL}/gerar-etp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!response.ok) throw new Error('Erro ao gerar ETP');
    return response.json();
  },
  
  gerarTR: async (dados: any) => {
    const response = await fetch(`${API_URL}/gerar-tr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!response.ok) throw new Error('Erro ao gerar TR');
    return response.json();
  },

  pesquisarPNCP: async (palavra_chave: string) => {
    const response = await fetch(`${API_URL}/pesquisa-pncp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ palavra_chave }),
    });
    if (!response.ok) throw new Error('Erro ao buscar preços no PNCP');
    return response.json();
  },

  validarHashAuditoria: async (hash: string) => {
    const response = await fetch(`${API_URL}/auditoria/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash_code: hash }),
    });
    return response.json();
  },

  buscarInfoOrgao: async (cidadeOuCnpj: string) => {
    const response = await fetch(`${API_URL}/orgao/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cidade_ou_cnpj: cidadeOuCnpj }),
    });
    if (!response.ok) throw new Error('Erro IBGE');
    return response.json();
  },

  obterDataMoatStats: async () => {
    const response = await fetch(`${API_URL}/data-lake/stats`);
    return response.json();
  },

  // BANCO DE DADOS (V2)
  iniciarProcesso: async (payload: any) => {
    const response = await fetch(`${API_URL_V2}/processos/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let message = 'Erro ao iniciar processo';
      try {
        const errorData = await response.json();
        message = errorData?.detail || message;
      } catch {
        message = response.statusText || message;
      }
      throw new Error(message);
    }
    try {
      const data = await response.json();
      if (!data?.id_processo) {
        throw new Error('Resposta do servidor sem identificador do processo.');
      }
      return data;
    } catch (e: any) {
      if (e?.message && e.message !== 'Resposta do servidor sem identificador do processo.') throw e;
      throw new Error('Resposta inválida do servidor. Tente novamente.');
    }
  },

  salvarNoBanco: async (dados: any) => {
    const response = await fetch(`${API_URL_V2}/processo/salvar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return response.json();
  },

  listarDoBanco: async (cidade: string) => {
    try {
      const encoded = encodeURIComponent(cidade);
      const response = await fetch(`${API_URL_V2}/processos/${encoded}`);
      if (!response.ok) {
        console.warn('[API] Listar processos falhou:', response.status, response.statusText);
        return { status: 'sucesso', processos: [] };
      }
      const data = await response.json();
      return data && typeof data.processos !== 'undefined' ? data : { status: 'sucesso', processos: [] };
    } catch (err) {
      console.warn('[API] Listar processos exceção:', err);
      return { status: 'sucesso', processos: [] };
    }
  }
};