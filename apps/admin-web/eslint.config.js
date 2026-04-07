import reactConfig from '@repo/config/eslint/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  reactConfig,
  {
    ignores: ['src/api/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
