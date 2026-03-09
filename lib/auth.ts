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
    const data = JSON.parse(raw) as Partial<AuthData> & { login?: string };
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

/** Considera autenticado se existir formato novo (token + loginTime) ou legado (login, ex.: vindo do cadastro). */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  console.log('[AUTH] check');
  const raw = localStorage.getItem(AUTH_KEY);
  if (raw == null || raw === '') return false;

  let auth = parseAuth(raw);

  // Formato legado (cadastro): { login, senha, cidade, ... } sem token/loginTime → migrar e aceitar
  if (!auth) {
    try {
      const data = JSON.parse(raw) as Record<string, unknown> & { login?: string };
      if (data && typeof data.login === 'string') {
        let orgao = data.orgao;
        if (orgao == null) {
          try {
            const rawOrgao = localStorage.getItem(ORGAO_DATA_KEY);
            if (rawOrgao) orgao = JSON.parse(rawOrgao);
          } catch {
            orgao = data;
          }
        }
        const migrated: AuthData = {
          token: 'auth',
          orgao: orgao ?? data,
          loginTime: Date.now(),
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(migrated));
        auth = migrated;
      }
    } catch {
      return false;
    }
  }

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

/**
 * Limpa a sessão apenas se existir loginTime e estiver expirada.
 * Evita logout acidental ao montar a página de login com sessão ainda válida.
 */
export function clearAuthIfExpired(): void {
  if (typeof window === 'undefined') return;
  const auth = getAuth();
  if (!auth || typeof auth.loginTime !== 'number') return;
  const elapsed = Date.now() - auth.loginTime;
  if (elapsed > SESSION_DURATION) {
    clearAuth();
  }
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
