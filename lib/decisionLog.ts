// decisionLog.ts

import type { DecisionEventType } from "./decisionEvents";

export type DecisionEvent = {
  processId: string;
  event: DecisionEventType;
  baseLegal?: string;
  user?: string;
  timestamp: number;
};

const STORAGE_KEY = "licitacao_decision_log";

/**
 * Obtém todos eventos registrados do localStorage.
 * Retorna um array de DecisionEvent. Se não houver nada, retorna [].
 */
function readLog(): DecisionEvent[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.processId === "string" &&
        typeof e.event === "string" &&
        typeof e.timestamp === "number"
    ) as DecisionEvent[];
  } catch {
    return [];
  }
}

/**
 * Grava todos eventos no localStorage.
 */
function writeLog(allEvents: DecisionEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));
}

/**
 * Registra um novo evento de decisão administrativa.
 */
export function logDecision(event: DecisionEvent): void {
  const allEvents = readLog();
  allEvents.push(event);
  writeLog(allEvents);
}

/**
 * Obtém todos eventos do log para um processId específico.
 */
export function getDecisionLog(processId: string): DecisionEvent[] {
  const allEvents = readLog();
  return allEvents.filter(
    (e) => e.processId === processId
  );
}
