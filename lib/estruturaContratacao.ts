/**
 * Módulo de estrutura de contratação.
 * Centraliza a estrutura de itens do processo licitatório com compatibilidade
 * com as chaves antigas do localStorage.
 */
import { LICITACAO_STORAGE_KEYS } from './storageKeys';

// Chaves antigas (presentes em LICITACAO_STORAGE_KEYS) para compatibilidade
const KEY_IS_AGRUPADO = 'licitacao_is_agrupado';
const KEY_ITENS_LOTE = 'licitacao_itens_lote';

export interface ItemContratacao {
  nome: string;
  quantidade: number;
  especificacao: string;
  unidade: string;
}

export interface EstruturaContratacao {
  isAgrupado: boolean;
  itens: ItemContratacao[];
}

const UNIDADE_DEFAULT = 'unidade';

/**
 * Normaliza um array de itens garantindo campos obrigatórios.
 * Define unidade como "unidade" quando ausente.
 */
export function normalizarItens(itens: Partial<ItemContratacao>[]): ItemContratacao[] {
  if (!Array.isArray(itens)) return [];
  return itens.map((item) => ({
    nome: typeof item?.nome === 'string' ? item.nome : '',
    quantidade: typeof item?.quantidade === 'number' && item.quantidade >= 0 ? item.quantidade : 1,
    especificacao: typeof item?.especificacao === 'string' ? item.especificacao : '',
    unidade: typeof item?.unidade === 'string' && item.unidade.trim() ? item.unidade.trim() : UNIDADE_DEFAULT,
  }));
}

/**
 * Lê a estrutura de contratação do localStorage.
 * Detecta estrutura antiga (licitacao_is_agrupado + licitacao_itens_lote),
 * converte para EstruturaContratacao e normaliza itens (unidade default: "unidade").
 */
export function getEstruturaContratacao(): EstruturaContratacao {
  const vazio: EstruturaContratacao = { isAgrupado: false, itens: [] };

  if (typeof window === 'undefined') return vazio;

  console.log('[STRUCTURE_LOAD]');

  try {
    const isAgrupadoRaw = localStorage.getItem(KEY_IS_AGRUPADO);
    const itensLoteRaw = localStorage.getItem(KEY_ITENS_LOTE);

    const isAgrupado = isAgrupadoRaw === 'true';

    let itens: ItemContratacao[] = [];
    if (itensLoteRaw) {
      const parsed = JSON.parse(itensLoteRaw);
      itens = normalizarItens(Array.isArray(parsed) ? parsed : []);
    }

    return { isAgrupado, itens };
  } catch {
    return vazio;
  }
}

/** Permite salvar com itens parciais (ex.: sem unidade); serão normalizados. */
export type EstruturaContratacaoInput = Omit<EstruturaContratacao, 'itens'> & { itens?: Partial<ItemContratacao>[] };

/**
 * Salva a estrutura de contratação no localStorage.
 * Mantém compatibilidade com o sistema atual gravando também
 * licitacao_is_agrupado e licitacao_itens_lote.
 */
export function saveEstruturaContratacao(estrutura: EstruturaContratacaoInput): void {
  if (typeof window === 'undefined') return;

  console.log('[STRUCTURE_SAVE]');

  const itens = normalizarItens(estrutura.itens ?? []);

  localStorage.setItem(KEY_IS_AGRUPADO, JSON.stringify(Boolean(estrutura.isAgrupado)));
  localStorage.setItem(KEY_ITENS_LOTE, JSON.stringify(itens));
}
