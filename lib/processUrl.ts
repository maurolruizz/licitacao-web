/**
 * Monta URL de navegação do pipeline com id_processo e regime na query.
 * Usado em /dfd, /etp, /tr, /pncp para manter contexto na URL.
 */
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
