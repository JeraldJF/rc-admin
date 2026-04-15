import { Configuration, FrontendApi } from '@ory/client';
import { getConfig } from './config';

// Lazy singleton — created on first call so getConfig() is guaranteed to be loaded
let _kratos: FrontendApi | null = null;
const getKratos = (): FrontendApi => {
  if (!_kratos) {
    _kratos = new FrontendApi(new Configuration({
      basePath: getConfig().VITE_ORY_KRATOS_PUBLIC,
      baseOptions: { withCredentials: true },
    }));
  }
  return _kratos;
};

export const oryService = {
  // Get session — used by Login.tsx to reuse an existing Kratos session
  async getSession() {
    try {
      const { data } = await getKratos().toSession();
      return data;
    } catch {
      return null;
    }
  },
};
