/**
 * Gerador do Relatório de Pesquisa de Preços IN 65/2021 em .DOCX (Microsoft Word).
 * Documento IN65 completo: identificação, fundamentação legal, metodologia,
 * tabela de preços, memória de cálculo, valor global e conclusão técnica.
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
import type { EstruturaContratacao, ItemContratacao } from './estruturaContratacao';

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
  unidade?: string;
}

/** Item de pesquisa para memória de cálculo (fonte, valor, url). */
export interface PesquisaItemDoc {
  fonte: string;
  valor: number;
  url?: string;
}

/** Resultado da pesquisa salvo em licitacao_resultado_pesquisa. */
export interface ResultadoPesquisaDoc {
  valorGlobal: number;
  itens: {
    nome: string;
    quantidade: number;
    valorItem: number;
    mediaReferencia: number;
    selecoes: PesquisaItemDoc[];
  }[];
  validacaoIN65?: { minimoPrecos: number; cvMaximoPercentual: number };
}

export interface DadosRelatorioPNCP {
  objetoContratacao: string;
  idProcesso?: string | null;
  regime?: string | null;
  municipio?: string | null;
  itens: ItemPesquisa[];
  selecoesPorItem: Record<number, PrecoAmostra[]>;
  /** Estrutura de contratação (itens, agrupamento) para documento IN65 completo. */
  estruturaContratacao?: EstruturaContratacao;
  /** Resultado homologado da pesquisa para documento IN65 completo. */
  resultadoPesquisa?: ResultadoPesquisaDoc;
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
 * Monta o documento Word "RELATÓRIO DE PESQUISA DE PREÇOS - IN 65/2021" (documento IN65 completo).
 * Seções: 1) Identificação do processo 2) Fundamentação legal 3) Metodologia 4) Tabela de preços
 * 5) Memória de cálculo 6) Valor global estimado 7) Conclusão técnica.
 * Retorna um Blob para download no navegador.
 */
export async function gerarRelatorioIN65Docx(dados: DadosRelatorioPNCP): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];
  const dataGeracao = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const resultado = dados.resultadoPesquisa;
  const estrutura = dados.estruturaContratacao;
  const itensFonte = estrutura?.itens?.length ? estrutura.itens : dados.itens;

  children.push(titulo('RELATÓRIO DE PESQUISA DE PREÇOS - IN 65/2021'));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Documento técnico de memória de cálculo e conformidade', size: 20, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // ——— 1. IDENTIFICAÇÃO DO PROCESSO ———
  children.push(subtitulo('1. Identificação do processo'));
  const tabelaIdentificacao = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE },
      bottom: { style: BorderStyle.SINGLE },
      left: { style: BorderStyle.SINGLE },
      right: { style: BorderStyle.SINGLE },
    },
    rows: [
      new TableRow({ children: [cel('Campo', true), cel('Informação', true)] }),
      new TableRow({ children: [cel('Objeto da contratação'), cel(dados.objetoContratacao || 'Não informado')] }),
      new TableRow({ children: [cel('ID do processo'), cel(dados.idProcesso ?? 'N/I')] }),
      new TableRow({ children: [cel('Regime'), cel(dados.regime ?? 'Não informado')] }),
      new TableRow({ children: [cel('Município/Órgão'), cel(dados.municipio ?? 'Não informado')] }),
      new TableRow({ children: [cel('Data de geração'), cel(dataGeracao)] }),
      new TableRow({ children: [cel('Sistema'), cel(`${SISTEMA_NOME} ${SISTEMA_VERSAO}`)] }),
    ],
  });
  children.push(tabelaIdentificacao);
  children.push(new Paragraph({ text: '', spacing: { after: 240 } }));

  // ——— 2. FUNDAMENTAÇÃO LEGAL (IN 65/2021) ———
  children.push(subtitulo('2. Fundamentação legal (IN 65/2021)'));
  children.push(
    corpo(
      'Art. 23 da Lei nº 14.133, de 1º de abril de 2021 (Lei de Licitações e Contratos): dispõe sobre a realização de pesquisa de preços para formação do preço de referência em licitações.'
    ),
    corpo(
      'Instrução Normativa TCU nº 65/2021: estabelece critérios e procedimentos para pesquisa de preços em compras públicas, incluindo número mínimo de fontes, análise estatística e coeficiente de variação.'
    ),
    corpo(
      'Este relatório foi elaborado em conformidade com a IN 65/2021 e com as orientações do Tribunal de Contas da União para fins de auditoria e formação do preço de referência.'
    )
  );
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  // ——— 3. METODOLOGIA DA PESQUISA ———
  children.push(subtitulo('3. Metodologia da pesquisa'));
  children.push(
    corpo('Fonte consultada: Portal Nacional de Contratações Públicas (PNCP), base oficial de preços de compras públicas.'),
    corpo(
      'Critérios aplicados: (a) seleção de no mínimo 3 (três) preços por item ou lote; (b) análise estatística dos valores (média, mediana, desvio padrão); (c) coeficiente de variação (CV) limitado a 25% entre os preços selecionados; (d) quando aplicável, exclusão de valores extremos (outliers) pelo método IQR para estabilizar o preço de referência.')
  );
  if (resultado?.validacaoIN65) {
    children.push(
      corpo(
        `Parâmetros de validação IN65 utilizados: mínimo de ${resultado.validacaoIN65.minimoPrecos} preços por item; CV máximo de ${resultado.validacaoIN65.cvMaximoPercentual}%.`
      )
    );
  }
  children.push(new Paragraph({ text: '', spacing: { after: 240 } }));

  // ——— 4. TABELA DE PREÇOS POR ITEM ———
  children.push(subtitulo('4. Tabela de preços por item'));

  if (resultado?.itens?.length) {
    resultado.itens.forEach((itemRes, index) => {
      const secaoItem = resultado.itens.length > 1 ? ` — Item ${index + 1}/${resultado.itens.length}: ${itemRes.nome}` : '';
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `4.${index + 1}${secaoItem}`, bold: true, size: 24 })],
          spacing: { before: 180, after: 100 },
        })
      );
      if (itemRes.selecoes?.length) {
        const headerRow = new TableRow({
          children: [
            cel('Fonte (órgão)', true),
            cel('Valor unit. (R$)', true),
            cel('URL/Link', true),
          ],
        });
        const rows = itemRes.selecoes.map(
          (s) =>
            new TableRow({
              children: [
                cel((s.fonte ?? '').slice(0, 50)),
                cel((s.valor ?? 0).toFixed(2).replace('.', ',')),
                cel((s.url ?? '—').slice(0, 40)),
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
      }
      children.push(
        corpo(`Preço de referência (média/estatístico): R$ ${itemRes.mediaReferencia.toFixed(2).replace('.', ',')} · Quantidade: ${itemRes.quantidade} · Valor do item: R$ ${itemRes.valorItem.toFixed(2).replace('.', ',')}.`)
      );
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    });
  } else {
    let valorGlobalEstimado = 0;
    dados.itens.forEach((item, index) => {
      const amostras = dados.selecoesPorItem[index] ?? [];
      const valores = amostras.map((a) => a.valor_unitario);
      const analysis: FullAnalysisResult = runFullAnalysis(valores);
      const secaoItem = dados.itens.length > 1 ? ` — Item ${index + 1}/${dados.itens.length}: ${item.nome}` : '';
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `4.${index + 1}${secaoItem}`, bold: true, size: 24 })],
          spacing: { before: index === 0 ? 0 : 180, after: 100 },
        })
      );
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
                cel((a.descricao_item ?? '').slice(0, 60)),
                cel((a.orgao_comprador ?? '').slice(0, 35)),
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
        const ref = analysis.referencePrice;
        const qtd = item.quantidade ?? 1;
        valorGlobalEstimado += ref * qtd;
        children.push(
          corpo(`Preço de referência: R$ ${ref.toFixed(2).replace('.', ',')} · Quantidade: ${qtd} · Valor do item: R$ ${(ref * qtd).toFixed(2).replace('.', ',')}.`)
        );
      }
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    });
    if (!resultado && dados.itens.length > 0) {
      const v = dados.itens.reduce((acc, item, idx) => {
        const sel = dados.selecoesPorItem[idx] ?? [];
        const vals = sel.map((s) => s.valor_unitario);
        const ref = runFullAnalysis(vals).referencePrice;
        return acc + ref * (item.quantidade ?? 1);
      }, 0);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Valor global estimado (soma dos itens): R$ ${v.toFixed(2).replace('.', ',')}`, bold: true, size: 22 })],
          spacing: { before: 120, after: 120 },
        })
      );
    }
  }

  // ——— 5. MEMÓRIA DE CÁLCULO ———
  children.push(subtitulo('5. Memória de cálculo'));
  if (resultado?.itens?.length) {
    resultado.itens.forEach((itemRes, index) => {
      children.push(
        corpo(
          `Item ${index + 1} (${itemRes.nome}): Preço de referência unitário = R$ ${itemRes.mediaReferencia.toFixed(2).replace('.', ',')}; Quantidade = ${itemRes.quantidade}; Valor do item = R$ ${itemRes.mediaReferencia.toFixed(2).replace('.', ',')} × ${itemRes.quantidade} = R$ ${itemRes.valorItem.toFixed(2).replace('.', ',')}.`
        )
      );
    });
  } else {
    dados.itens.forEach((item, index) => {
      const amostras = dados.selecoesPorItem[index] ?? [];
      const valores = amostras.map((a) => a.valor_unitario);
      const analysis = runFullAnalysis(valores);
      const qtd = item.quantidade ?? 1;
      const valorItem = analysis.referencePrice * qtd;
      children.push(
        corpo(
          `Item ${index + 1} (${item.nome}): Preço de referência = R$ ${analysis.referencePrice.toFixed(2).replace('.', ',')}; Quantidade = ${qtd}; Valor do item = R$ ${valorItem.toFixed(2).replace('.', ',')}.`
        )
      );
    });
  }
  children.push(new Paragraph({ text: '', spacing: { after: 240 } }));

  // ——— 6. VALOR GLOBAL ESTIMADO ———
  children.push(subtitulo('6. Valor global estimado'));
  let valorGlobalExibir: number;
  if (resultado?.valorGlobal != null) {
    valorGlobalExibir = resultado.valorGlobal;
  } else {
    valorGlobalExibir = itensFonte.reduce((acc, item, idx) => {
      const sel = dados.selecoesPorItem[idx] ?? [];
      const vals = sel.map((s: PrecoAmostra) => s.valor_unitario);
      const ref = runFullAnalysis(vals).referencePrice;
      const qtd = 'quantidade' in item ? item.quantidade : 1;
      return acc + ref * (qtd ?? 1);
    }, 0);
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Valor global estimado da contratação (soma dos itens): R$ ${valorGlobalExibir.toFixed(2).replace('.', ',')}`,
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // ——— 7. CONCLUSÃO TÉCNICA ———
  children.push(subtitulo('7. Conclusão técnica'));
  children.push(
    corpo(
      'Com base na pesquisa de preços realizada no PNCP e nos critérios da IN 65/2021 (mínimo de 3 preços por item e coeficiente de variação até 25%), o presente relatório atesta a formação do preço de referência para os itens objeto desta contratação.'
    ),
    corpo(
      'O valor global estimado acima constitui referência técnica para a fase de licitação, observadas as disposições da Lei 14.133/2021 e as orientações do Tribunal de Contas da União.'
    )
  );

  // Hash de auditoria
  const timestamp = new Date().toISOString();
  const valorParaHash = valorGlobalExibir;
  const payloadAuditoria = [
    dados.idProcesso ?? '',
    dados.objetoContratacao ?? '',
    String(valorParaHash.toFixed(2)),
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
  console.log('[IN65_DOCX_GERADO]');
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
