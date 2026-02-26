export const licitacaoService = {
  // Módulo 1: DFD
  gerarDFD: async (payload: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/preparatoria/gerar-dfd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw JSON.stringify(errorData.detail, null, 2);
    }
    return response.json();
  },

  // Módulo 2: ETP
  gerarETP: async (payload: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/preparatoria/gerar-etp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw JSON.stringify(errorData.detail, null, 2);
    }
    return response.json();
  },

  // NOVO: Módulo 3: TR (Termo de Referência)
  gerarTR: async (payload: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/preparatoria/gerar-tr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw JSON.stringify(errorData.detail, null, 2);
    }
    return response.json();
  }
};