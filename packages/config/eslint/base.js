import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config[]} */
export default defineConfig([
  globalIgnores(['node_modules', 'dist', '.next', '.turbo']),
  { files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'] },
  {
    extends: [js.configs['recommended'], tseslint.configs['recommendedTypeChecked']],
    rules: {
      'eqeqeq': ['error', 'always'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/only-throw-error': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
    },
  },
  {
    extends: [stylistic.configs['disable-legacy'], stylistic.configs['recommended']],
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/no-multi-spaces': ['error',
        { ignoreEOLComments: true },
      ],
      '@stylistic/no-multiple-empty-lines': ['error',
        { max: 1, maxBOF: 0, maxEOF: 0 },
      ],
      '@stylistic/object-property-newline': ['error',
        { allowAllPropertiesOnSameLine: true },
      ],
      '@stylistic/array-element-newline': ['error',
        {
          ArrayExpression: { multiline: true, consistent: true },
          ArrayPattern: { multiline: true, consistent: true },
        },
      ],
      '@stylistic/indent': ['error',
        2,
        {
          ImportDeclaration: 'first',
          SwitchCase: 1,
          flatTernaryExpressions: true,
        },
      ],
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/object-curly-newline': ['error',
        {
          ObjectExpression: { multiline: true, consistent: true },
          ObjectPattern: { multiline: true, consistent: true },
          ImportDeclaration: 'never',
          ExportDeclaration: 'never',
        },
      ],
      '@stylistic/jsx-self-closing-comp': ['error',
        {
          component: true,
          html: true,
        },
      ],
    },
  },
  {
    extends: [sonarjs.configs.recommended],
    rules: {
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-nested-functions': 'warn',
      'sonarjs/no-unused-vars': 'warn',
      'sonarjs/no-dead-store': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/table-header': 'warn',
      'sonarjs/pseudo-random': 'warn',
      'sonarjs/redundant-type-aliases': 'warn',
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
]);
