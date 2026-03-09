import type { ComplianceReport } from "./complianceReport";

/**
 * Formata um relatório de compliance em texto legível.
 *
 * @param report Objeto ComplianceReport a ser formatado
 * @returns string com o relatório formatado
 */
export function formatComplianceReport(report: ComplianceReport): string {
  // Função auxiliar para formatar datas
  function formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    // Formato: dd/mm/yyyy HH:MM:SS
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      pad(d.getDate()) +
      "/" +
      pad(d.getMonth() + 1) +
      "/" +
      d.getFullYear() +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  }

  let output = `Relatório de Conformidade\n`;
  output += `Processo: ${report.processId}\n`;
  output += `Gerado em: ${formatDate(report.generatedAt)}\n`;
  output += `\nLinha do Tempo:\n`;

  // Ordena eventos por timestamp crescente
  const timelineSorted = [...report.timeline].sort((a, b) => a.timestamp - b.timestamp);

  timelineSorted.forEach((event) => {
    let line = `${formatDate(event.timestamp)} - ${event.event}`;
    if (event.baseLegal) {
      line += ` (Base Legal: ${event.baseLegal})`;
    }
    output += line + "\n";
  });

  return output.trim();
}