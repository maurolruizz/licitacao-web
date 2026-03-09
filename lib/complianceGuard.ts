import { validateDispensa } from "./complianceEngine";
import { logDecision } from "./decisionLog";
import type { DecisionEventType } from "./decisionEvents";

/**
 * Guarda de compliance para a decisão de dispensa de licitação.
 * Impede decisões administrativas ilegais e registra o evento.
 *
 * @param processId ID do processo
 * @param valorEstimado Valor estimado do objeto (para avaliação da dispensa)
 * @param user Usuário que realizou a ação (opcional)
 * @returns Objeto { allowed: boolean, reason?: string }
 */
export function guardDispensa(
  processId: string,
  valorEstimado: number,
  user?: string
): { allowed: true } | { allowed: false; reason: string } {
  const result = validateDispensa(valorEstimado);

  if (!result.valid) {
    return { allowed: false, reason: result.message || "Dispensa inválida" };
  }

  logDecision({
    processId,
    event: "DISPENSA_VALIDATED" as DecisionEventType,
    baseLegal: result.baseLegal,
    user,
    timestamp: Date.now(),
  });

  return { allowed: true };
}