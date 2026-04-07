import reactConfig from '@repo/config/eslint/react';
import { defineConfig } from 'eslint/config';
import storybook from 'eslint-plugin-storybook';

export default defineConfig([
  {
    ignores: ['src/components/ui/**', 'src/lib/**'],
  },
  reactConfig,
  storybook.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
