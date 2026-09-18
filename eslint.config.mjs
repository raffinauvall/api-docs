import react from 'eslint-plugin-react'

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly',
  performance: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
  fetch: 'readonly', URL: 'readonly', FormData: 'readonly', Blob: 'readonly'
}

const nodeGlobals = {
  process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', fetch: 'readonly'
}

const baseRules = {
  eqeqeq: 'error',
  'no-constant-condition': 'error',
  'no-unreachable': 'error',
  'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }]
}

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/pgdata/**'] },
  {
    files: ['client/src/**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: browserGlobals },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: { ...baseRules, 'react/jsx-uses-vars': 'error' }
  },
  {
    files: ['server/src/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: nodeGlobals },
    rules: baseRules
  }
]
