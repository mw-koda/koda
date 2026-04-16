const TOKEN_KEY = 'koda_token';
const LOGIN_PATH = '/login';

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
}

export const auth = {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('userOrganizationId');
    sessionStorage.clear();
  },

  logoutAndRedirect() {
    this.clearSession();
    redirectToLogin();
  },

  handleAuthFailure(status?: number) {
    if (status === undefined || status === 401 || status === 403) {
      this.logoutAndRedirect();
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /** Attach to fetch calls: fetch(url, { headers: auth.headers() }) */
  headers(): Record<string, string> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      this.logoutAndRedirect();
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  },
};