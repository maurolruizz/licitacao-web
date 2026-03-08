/**
 * Módulo de autenticação do LicitaIA.
 * Centraliza verificação de autenticação via localStorage.
 */

const AUTH_KEY = 'licitacao_auth';
const ORGAO_DATA_KEY = 'licitacao_orgao_data';

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  console.log('[AUTH] check');
  const raw = localStorage.getItem(AUTH_KEY);
  return raw != null && raw !== '';
}

export function getAuth(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  console.log('[AUTH] clear');
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ORGAO_DATA_KEY);
}

export interface AuthRouter {
  replace(url: string): void;
}

export function requireAuth(router: AuthRouter): boolean {
  if (isAuthenticated()) return true;
  console.log('[AUTH] redirect login');
  router.replace('/login');
  return false;
}
