import { getDecisionLog } from "./decisionLog";

export type AuditTimelineEvent = {
  timestamp: number;
  event: string;
  baseLegal?: string;
  user?: string;
};

/**
 * Gera a linha do tempo de compliance para um processo,
 * ordenando eventos administrativos do log.
 *
 * @param processId ID do processo
 * @returns Lista ordenada de eventos da linha do tempo
 */
export function generateAuditTimeline(processId: string): AuditTimelineEvent[] {
  const events = getDecisionLog(processId);
  return events
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => ({
      timestamp: e.timestamp,
      event: e.event,
      baseLegal: e.baseLegal,
      user: e.user,
    }));
}