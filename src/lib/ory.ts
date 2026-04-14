import { Configuration, FrontendApi } from '@ory/client';

const kratosConfig = new Configuration({
  basePath: import.meta.env.VITE_ORY_KRATOS_PUBLIC,
  baseOptions: {
    withCredentials: true,
  },
});

export const kratos = new FrontendApi(kratosConfig);

export const oryService = {
  // Get session — used by Login.tsx to reuse an existing Kratos session
  async getSession() {
    try {
      const { data } = await kratos.toSession();
      return data;
    } catch (error) {
      return null;
    }
  },
};
