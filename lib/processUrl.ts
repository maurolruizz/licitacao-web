/**
 * Monta URL de navegação do pipeline com id_processo e regime na query.
 * Usado em /dfd, /etp, /tr, /pncp para manter contexto na URL.
 */

/** Etapa correta após "Verificar Compliance" em /novo. Nunca redirecionar para /processos nesse fluxo. */
export const PIPELINE_STEP_AFTER_NOVO = '/dfd' as const;

/** Ordem esperada do pipeline: /novo → /dfd → /etp → /tr → /pncp */
export const PIPELINE_ORDER = ['/novo', '/dfd', '/etp', '/tr', '/pncp'] as const;

export function buildProcessPath(
  path: string,
  id: string | null,
  regime: string | null
): string {
  if (id && regime) {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}id=${encodeURIComponent(id)}&regime=${encodeURIComponent(regime)}`;
  }
  return path;
}

/** Monta URL da primeira etapa do processo (DFD) após criar processo em /novo. */
export function buildDfdPath(idProcesso: string, regime: string): string {
  return buildProcessPath(PIPELINE_STEP_AFTER_NOVO, idProcesso, regime);
}
