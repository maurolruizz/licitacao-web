const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

  // NOVO: CONEXÃO COM A FASE 4 (PNCP) - REGRESSÃO ZERO
  buscarPrecosPNCP: async (palavraChave: string) => {
    const response = await fetch(`${API_URL}/pesquisa-pncp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ palavra_chave: palavraChave }),
    });
    if (!response.ok) throw new Error('Erro ao buscar preços no PNCP (Mock)');
    return response.json();
  }
};