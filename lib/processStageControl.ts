/**
 * Controla os estágios do workflow legal do processo de licitação.
 */

export type ProcessStage = "DFD" | "ETP" | "TR" | "PNCP" | "FINAL";

const STAGE_ORDER: ProcessStage[] = [
  "DFD",
  "ETP",
  "TR",
  "PNCP",
  "FINAL"
];

/**
 * Retorna o próximo estágio do workflow, ou null se estiver no final.
 * @param stage Estágio atual do processo
 */
export function getNextStage(stage: ProcessStage): ProcessStage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[idx + 1];
}

/**
 * Verifica se uma transição de estágio é permitida na ordem legal.
 * @param current Estágio atual
 * @param target Estágio desejado
 */
export function canTransition(current: ProcessStage, target: ProcessStage): boolean {
  const currentIdx = STAGE_ORDER.indexOf(current);
  const targetIdx = STAGE_ORDER.indexOf(target);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return targetIdx === currentIdx + 1;
}