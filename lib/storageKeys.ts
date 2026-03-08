/**
 * Chaves de localStorage/sessionStorage usadas pelo LicitaIA.
 * Usado no logout para limpar todo o estado (evitar ghost state).
 */
export const LICITACAO_STORAGE_KEYS = [
  'licitacao_auth',
  'licitacao_orgao_data',
  'licitacao_id_processo',
  'licitacao_regime',
  'licitacao_objeto',
  'licitacao_especificacao',
  'licitacao_is_agrupado',
  'licitacao_itens_lote',
  'licitacao_risco',
  'licitacao_tr_status',
  'licitacao_pncp_concluido',
  'licitacao_valor_estimado',
  'licitacao_in65_hash',
  'licitacao_hash_auditoria_ativo',
  'licitacao_dfd_objeto',
  'licitacao_dfd_setor',
  'licitacao_dfd_origem',
  'licitacao_dfd_impacto',
  // Motor de estrutura da contratação e geração do IN65
  'licitacao_estrutura_contratacao',
  'licitacao_resultado_pesquisa',
  'licitacao_documento_in65',
] as const;
