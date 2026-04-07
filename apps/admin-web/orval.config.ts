import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: 'http://localhost:3000/docs-json',
    output: {
      mode: 'split',
      target: 'src/api/endpoints.ts',
      schemas: 'src/api/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/axios-instance.ts',
          name: 'axiosInstance',
        },
      },
    },
  },

  zod: {
    input: 'http://localhost:3000/docs-json',
    output: {
      client: 'zod',
      mode: 'single',
      target: 'src/api/zod.ts',
    },
  },
});
