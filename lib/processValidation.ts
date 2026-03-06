/**
 * Validação do processo para conformidade com a Lei 14.133/2021.
 * Verifica: DFD gerado, ETP gerado ou dispensado, TR gerado, Pesquisa de preços concluída.
 */

const FASES_ORDEM: Record<string, number> = {
  DFD_CONCLUIDO: 1,
  ETP_CONCLUIDO: 2,
  TR_CONCLUIDO: 3,
  PESQUISA_CONCLUIDA: 4,
};

export interface ProcessValidationResult {
  valid: boolean;
  messages: string[];
}

/**
 * Valida se o processo está em conformidade com a Lei 14.133/2021.
 * - DFD: considerado gerado se o processo existe (fase_atual definida).
 * - ETP: concluído ou dispensado legalmente (regime dispensa/inexigibilidade).
 * - TR: concluído (fase >= TR_CONCLUIDO).
 * - Pesquisa de preços: concluída (fase === PESQUISA_CONCLUIDA).
 */
export function validateProcess(proc: { fase_atual?: string | null; regime?: string | null }): ProcessValidationResult {
  const messages: string[] = [];
  const fase = proc.fase_atual || '';
  const ordem = FASES_ORDEM[fase] ?? 0;
  const regime = (proc.regime || '').toUpperCase();

  // 1. DFD gerado
  if (ordem < 1) {
    messages.push('Falta o Documento de Formalização de Demanda (DFD). Gere o DFD para este processo.');
  }

  // 2. ETP gerado ou dispensado (dispensa/inexigibilidade não exigem ETP)
  const etpDispensado = regime === 'DISPENSA' || regime === 'INEXIGIBILIDADE';
  if (!etpDispensado && ordem < 2) {
    messages.push(
      'Falta o Estudo Técnico Preliminar (ETP). Conclua o ETP ou confirme se o tipo de contratação dispensa essa etapa.'
    );
  }

  // 3. TR gerado
  if (ordem < 3) {
    messages.push('Falta o Termo de Referência (TR). Conclua o TR antes da pesquisa de preços.');
  }

  // 4. Pesquisa de preços concluída
  if (ordem < 4) {
    messages.push(
      'Falta concluir a pesquisa de preços. Realize a pesquisa e finalize no módulo de preços para validar o processo.'
    );
  }

  return {
    valid: messages.length === 0,
    messages,
  };
}
