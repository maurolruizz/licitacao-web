/**
 * Módulo de autenticação do LicitaIA.
 * Centraliza verificação de autenticação via localStorage com expiração de sessão.
 */

const AUTH_KEY = 'licitacao_auth';
const ORGAO_DATA_KEY = 'licitacao_orgao_data';

/** Duração da sessão: 30 minutos. */
export const SESSION_DURATION = 30 * 60 * 1000;

export interface AuthData {
  token: string;
  orgao: unknown;
  loginTime: number;
}

function parseAuth(raw: string): AuthData | null {
  try {
    const data = JSON.parse(raw) as Partial<AuthData>;
    if (data && typeof data.token === 'string' && typeof data.loginTime === 'number') {
      return {
        token: data.token,
        orgao: data.orgao,
        loginTime: data.loginTime,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  console.log('[AUTH] check');
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw == null || raw === '') return false;

  const auth = parseAuth(raw);
  if (!auth) return false;

  const elapsed = Date.now() - auth.loginTime;
  if (elapsed > SESSION_DURATION) {
    console.log('[AUTH] session expired');
    clearAuth();
    return false;
  }
  return true;
}

export function getAuth(): AuthData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw == null || raw === '') return null;
  return parseAuth(raw);
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  console.log('[AUTH] clear');
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ORGAO_DATA_KEY);
}

/** Atualiza loginTime para manter a sessão ativa enquanto o usuário usa o sistema. */
export function refreshSession(): void {
  if (typeof window === 'undefined') return;
  const auth = getAuth();
  if (!auth) return;
  auth.loginTime = Date.now();
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  console.log('[AUTH] session refreshed');
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
