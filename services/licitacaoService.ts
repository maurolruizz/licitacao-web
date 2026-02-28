const isProducao = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const API_URL = isProducao 
  ? 'https://licitacao-ai-core.onrender.com/api/v1' 
  : 'http://localhost:8000/api/v1';

export const licitacaoService = {
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

  buscarPrecosPNCP: async (palavraChave: string) => {
    const response = await fetch(`${API_URL}/pesquisa-pncp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ palavra_chave: palavraChave }),
    });
    if (!response.ok) throw new Error('Erro ao buscar preços na IN 65');
    return response.json();
  },

  // NOVA ROTA DE AUDITORIA (Sprint 5)
  validarHashAuditoria: async (hash: string) => {
    const response = await fetch(`${API_URL}/auditoria/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash_code: hash }),
    });
    if (!response.ok) throw new Error('Erro na conexão com o sistema de verificação.');
    return response.json();
  }
};