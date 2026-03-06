/**
 * Hash de auditoria SHA256 para documentos gerados (DFD, ETP, TR, Relatório IN65).
 * Exibido no rodapé de cada documento para rastreabilidade.
 */

/**
 * Gera hash SHA256 em hexadecimal (Web Crypto API).
 */
export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Monta o payload para auditoria: identificador do processo + tipo do documento + conteúdo resumido + timestamp.
 */
function buildPayload(
  idProcesso: string,
  tipoDocumento: 'DFD' | 'ETP' | 'TR',
  conteudo: string,
  timestamp: string
): string {
  const conteudoLimitado = conteudo.length > 4000 ? conteudo.slice(0, 4000) : conteudo;
  return [idProcesso, tipoDocumento, conteudoLimitado, timestamp].join('|');
}

/**
 * Gera o hash de auditoria para documento DFD/ETP/TR.
 */
export async function gerarHashAuditoriaDocumento(
  idProcesso: string,
  tipo: 'DFD' | 'ETP' | 'TR',
  textoOficial: string
): Promise<{ hash: string; timestamp: string }> {
  const timestamp = new Date().toISOString();
  const payload = buildPayload(idProcesso, tipo, textoOficial, timestamp);
  const hash = await sha256Hex(payload);
  return { hash, timestamp };
}

/**
 * Retorna o HTML do rodapé com o hash de auditoria para inserção no documento exportado.
 */
export function rodapeHashAuditoriaHtml(hash: string, timestamp?: string): string {
  const ts = timestamp ? ` Gerado em: ${timestamp}` : '';
  return `<p style="margin-top: 2em; padding-top: 1em; border-top: 1px solid #ccc; font-family: Arial, sans-serif; font-size: 10pt; color: #333;"><strong>Hash de Auditoria (SHA256):</strong> ${hash}${ts}</p>`;
}
