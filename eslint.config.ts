import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import json from '@eslint/json'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import sonarjs from 'eslint-plugin-sonarjs';
import eslintComments from 'eslint-plugin-eslint-comments';
import financial from 'eslint-plugin-financial';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores(['**/.sst/', '.idea/', '**/dist', '**/.next', '**/build']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node },
  },
  stylistic.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      'sonarjs': sonarjs,
      'financial': financial,
      'eslint-comments': eslintComments,
    },
    rules: {
      // Spread rules from extended configs
      ...sonarjs.configs.recommended.rules,
      ...financial.configs.recommended.rules,
      ...eslintComments.configs.recommended.rules,

      // Custom rules
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/explicit-function-return-type': ['off'],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      '@typescript-eslint/no-floating-promises': ['error'],
      '@typescript-eslint/no-unused-vars': ['warn'],
      // https://github.com/eslint/eslint/issues/12986#issuecomment-593326850
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      // recommended-requiring-type-checking
      // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended-requiring-type-checking.ts
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      'complexity': ['error', 6],
      'import/no-extraneous-dependencies': 'off',
      'import/order': [
        'warn',
        {
          groups: [['external', 'builtin']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'import/prefer-default-export': 'off',
      'jest/expect-expect': 'off',
      'jest/valid-title': 'off',
      'max-params': ['error', 3],
      'no-await-in-loop': 'off',
      'no-console': ['warn'],
      'no-implicit-coercion': 'error',
      'no-import-assign': 'error',
      'no-loss-of-precision': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-restricted-syntax': 'off',
      'no-setter-return': 'error',
      'no-template-curly-in-string': 'off',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-vars': 'off',
      'require-await': 'error',
      'sonarjs/cognitive-complexity': ['error', 5],
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/prefer-immediate-return': 'off',
      'curly': ['error', 'all'],
    },
  }
  {
    files: ['*.test.ts'],
    rules: {
      'sonarjs/cognitive-complexity': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
  { files: ['**/*.jsonc'], plugins: { json }, language: 'json/jsonc', extends: ['json/recommended'] },
  { files: ['**/*.json5'], plugins: { json }, language: 'json/json5', extends: ['json/recommended'] },
])
