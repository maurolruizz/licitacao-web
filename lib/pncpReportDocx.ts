/**
 * Gerador do Relatório de Pesquisa de Preços IN 65/2021 em .DOCX (Microsoft Word).
 * Geração client-side com a biblioteca docx.
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Packer,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  convertInchesToTwip,
} from 'docx';
import { runFullAnalysis, type FullAnalysisResult } from './pncpStatsEngine';
import { sha256Hex } from './auditHash';

export interface PrecoAmostra {
  id_compra: string;
  descricao_item?: string;
  orgao_comprador?: string;
  data_publicacao?: string;
  valor_unitario: number;
  corrigidoIPCA?: boolean;
}

export interface ItemPesquisa {
  nome: string;
  quantidade?: number;
  especificacao?: string;
}

export interface DadosRelatorioPNCP {
  objetoContratacao: string;
  idProcesso?: string | null;
  regime?: string | null;
  municipio?: string | null;
  itens: ItemPesquisa[];
  selecoesPorItem: Record<number, PrecoAmostra[]>;
}

const SISTEMA_NOME = 'LicitaIA GovTech Engine';
const SISTEMA_VERSAO = '1.0.0';

function cel(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20 })],
      })],
  });
}

function titulo(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

function subtitulo(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 240, after: 120 },
  });
}

function corpo(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

/**
 * Monta o documento Word "RELATÓRIO DE PESQUISA DE PREÇOS - IN 65/2021".
 * Retorna um Blob para download no navegador.
 */
export async function gerarRelatorioIN65Docx(dados: DadosRelatorioPNCP): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];
  const dataGeracao = new Date().toISOString().slice(0, 19).replace('T', ' ');

  children.push(titulo('RELATÓRIO DE PESQUISA DE PREÇOS - IN 65/2021'));

  // Metadados institucionais (abaixo do título)
  const meta = [
    { label: 'Município', value: dados.municipio ?? 'Não informado' },
    { label: 'ID do processo de contratação', value: dados.idProcesso ?? 'N/I' },
    { label: 'Sistema', value: SISTEMA_NOME },
    { label: 'Versão do sistema', value: SISTEMA_VERSAO },
    { label: 'Data de geração do documento', value: dataGeracao },
  ];
  meta.forEach(({ label, value }) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, size: 20, bold: true }),
          new TextRun({ text: value, size: 20 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    );
  });
  children.push(new Paragraph({ text: '', spacing: { after: 280 } }));
  if (dados.regime) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Regime: ${dados.regime}`, size: 20, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // 1. Objeto da contratação
  children.push(subtitulo('1. Objeto da contratação'));
  children.push(corpo(dados.objetoContratacao || 'Não informado.'));

  // 2. Fontes consultadas
  children.push(subtitulo('2. Fontes consultadas'));
  children.push(
    corpo('Portal Nacional de Contratações Públicas (PNCP) – base de preços de compras públicas.')
  );

  // 3 e seguintes: por item (amostras, estatísticas, outliers, preço de referência)
  let valorGlobalEstimado = 0;

  dados.itens.forEach((item, index) => {
    const amostras = dados.selecoesPorItem[index] ?? [];
    const valores = amostras.map((a) => a.valor_unitario);
    const analysis: FullAnalysisResult = runFullAnalysis(valores);

    const secaoItem = dados.itens.length > 1 ? ` (Item ${index + 1}/${dados.itens.length}: ${item.nome})` : '';
    children.push(subtitulo(`3. Amostras de preços coletadas${secaoItem}`));

    if (amostras.length === 0) {
      children.push(corpo('Nenhuma amostra selecionada para este item.'));
    } else {
      const headerRow = new TableRow({
        children: [
          cel('ID Compra', true),
          cel('Descrição', true),
          cel('Órgão', true),
          cel('Data', true),
          cel('Valor unit. (R$)', true),
        ],
      });
      const rows = amostras.map(
        (a) =>
          new TableRow({
            children: [
              cel(a.id_compra ?? ''),
              cel((a.descricao_item ?? '').slice(0, 80)),
              cel((a.orgao_comprador ?? '').slice(0, 40)),
              cel(a.data_publicacao ?? ''),
              cel(a.valor_unitario.toFixed(2).replace('.', ',') + (a.corrigidoIPCA ? ' (IPCA)' : '')),
            ],
          })
      );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE },
            bottom: { style: BorderStyle.SINGLE },
            left: { style: BorderStyle.SINGLE },
            right: { style: BorderStyle.SINGLE },
          },
          rows: [headerRow, ...rows],
        })
      );
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    }

    children.push(subtitulo(`Fundamentação legal${secaoItem}`));
    children.push(
      corpo(
        'Esta pesquisa de preços foi realizada em conformidade com o art. 23 da Lei 14.133/2021 e com a Instrução Normativa nº 65/2021.'
      )
    );

    children.push(subtitulo(`4. Resultados da análise estatística${secaoItem}`));
    if (valores.length === 0) {
      children.push(corpo('Não há dados para análise estatística.'));
    } else {
      const tabelaResumo = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE },
          bottom: { style: BorderStyle.SINGLE },
          left: { style: BorderStyle.SINGLE },
          right: { style: BorderStyle.SINGLE },
        },
        rows: [
          new TableRow({
            children: [cel('Indicador', true), cel('Valor', true)],
          }),
          new TableRow({
            children: [
              cel('Preço médio (R$)'),
              cel(analysis.raw.mean.toFixed(2).replace('.', ',')),
            ],
          }),
          new TableRow({
            children: [
              cel('Preço do meio – mediana (R$)'),
              cel(analysis.raw.median.toFixed(2).replace('.', ',')),
            ],
          }),
          new TableRow({
            children: [
              cel('Diferença entre preços (R$)'),
              cel(analysis.raw.standardDeviation.toFixed(2).replace('.', ',')),
            ],
          }),
          new TableRow({
            children: [
              cel('Variação dos preços (%)'),
              cel(`${analysis.raw.coefficientOfVariation.toFixed(2)}%`),
            ],
          }),
        ],
      });
      children.push(tabelaResumo);
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      if (!analysis.cvCompliance && analysis.cvAlertMessage) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Os preços coletados apresentam variação acima de 25%. ${analysis.cvAlertMessage}`,
                size: 22,
                bold: true,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    }

    children.push(subtitulo(`5. Justificativa de valores extremos removidos${secaoItem}`));
    if (analysis.hadOutliers && analysis.iqr) {
      children.push(
        corpo(
          `Foram desconsiderados preços muito altos ou muito baixos. Intervalo utilizado: de R$ ${analysis.iqr.q1.toFixed(2).replace('.', ',')} a R$ ${analysis.iqr.q3.toFixed(2).replace('.', ',')}.`
        ),
        corpo(
          `Valores removidos por estarem fora do intervalo aceitável: ${analysis.iqr.outliers.map((v) => `R$ ${v.toFixed(2).replace('.', ',')}`).join('; ')}.`
        )
      );
      if (analysis.afterOutlierRemoval) {
        children.push(
          corpo(
            `Após a remoção: ${analysis.afterOutlierRemoval.count} preços utilizados; variação resultante: ${analysis.afterOutlierRemoval.coefficientOfVariation.toFixed(2)}%.`
          )
        );
      }
    } else {
      children.push(corpo('Não foi necessário remover nenhum valor extremo, ou não havia preços suficientes para aplicar o critério.'));
    }

    children.push(subtitulo(`6. Preço de referência final${secaoItem}`));
    const ref = analysis.referencePrice;
    const qtd = item.quantidade ?? 1;
    valorGlobalEstimado += ref * qtd;
    children.push(
      corpo(`Preço unitário de referência: R$ ${ref.toFixed(2).replace('.', ',')}.`),
      corpo(`Quantidade: ${qtd}. Valor total do item: R$ ${(ref * qtd).toFixed(2).replace('.', ',')}.`)
    );
  });

  if (dados.itens.length > 1) {
    children.push(
      new Paragraph({ text: '', spacing: { before: 240 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Valor global estimado (soma dos itens): R$ ${valorGlobalEstimado.toFixed(2).replace('.', ',')}`,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Hash de auditoria (SHA256): process id + objeto + preço de referência + timestamp
  const timestamp = new Date().toISOString();
  const payloadAuditoria = [
    dados.idProcesso ?? '',
    dados.objetoContratacao ?? '',
    valorGlobalEstimado.toFixed(2),
    timestamp,
  ].join('|');
  const hashAuditoria = await sha256Hex(payloadAuditoria);

  children.push(
    new Paragraph({ text: '', spacing: { before: 320 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Hash de Auditoria (SHA256)', bold: true, size: 22 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Hash de Auditoria (SHA256): ${hashAuditoria}`,
          size: 20,
          font: 'Consolas',
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Gerado em: ${timestamp}`, size: 18, italics: true })],
      spacing: { after: 120 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Dispara o download do relatório no navegador.
 */
export function downloadRelatorioIN65(blob: Blob, filename = 'Relatorio_Pesquisa_Precos_IN65_2021.docx'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
