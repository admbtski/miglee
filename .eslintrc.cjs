module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],
    // Enforce feature boundary imports - import from feature root, not internals
    'no-restricted-imports': [
      'warn', // Start with 'warn' during migration, change to 'error' later
      {
        patterns: [
          {
            group: ['@/features/*/api/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
          {
            group: ['@/features/*/components/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
          {
            group: ['@/features/*/hooks/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
          {
            group: ['@/features/*/types/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
          {
            group: ['@/features/*/utils/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
          {
            group: ['@/features/*/constants/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
        ],
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist', '**/__generated__/**'],
};
