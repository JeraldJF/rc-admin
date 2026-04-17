export interface AppConfig {
  VITE_API_BASE_URL: string;
  VITE_OAUTH2_CLIENT_ID: string;
  VITE_OAUTH2_REDIRECT_URI: string;
  VITE_ORY_HYDRA_PUBLIC: string;
  VITE_ORY_KRATOS_PUBLIC: string;
  VITE_ISSUER_DID: string;
  VITE_SCHEMA_ID: string;
  VITE_SCHEMA_VERSION: string;
  VITE_TEMPLATE_ID: string;
}

let _config: AppConfig | null = null;

/**
 * Fetch runtime config from the Express server's /config endpoint.
 * Must be called once in main.tsx before the app renders.
 */
export async function loadConfig(): Promise<AppConfig> {
  const response = await fetch('/config');
  if (!response.ok) {
    throw new Error(`Failed to load app config: HTTP ${response.status}`);
  }
  _config = (await response.json()) as AppConfig;
  return _config;
}

/**
 * Returns the already-loaded config synchronously.
 * Safe to call inside any function/component because loadConfig() always
 * completes before React renders the first component.
 */
export function getConfig(): AppConfig {
  if (!_config) {
    throw new Error('App config not loaded. Ensure loadConfig() is called before rendering.');
  }
  return _config;
}
