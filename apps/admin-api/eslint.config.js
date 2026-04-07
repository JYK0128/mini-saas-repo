import nestConfig from '@repo/config/eslint/nest';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  nestConfig,
  { ignores: ['./src/database/types'] },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
