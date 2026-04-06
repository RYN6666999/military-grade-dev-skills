// Minimal ESLint flat config for apps/web.
// Phase 4: just enough to make lint stable and runnable.
// Extended ESLint rules (no-explicit-any enforcement, import ordering, etc.)
// are added in a later phase once the baseline is confirmed clean.

import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Ignore generated / build output
  { ignores: ['.next/**', 'node_modules/**'] },

  // TypeScript recommended rules — catches real bugs without being noisy
  ...tseslint.configs.recommended,

  {
    rules: {
      // Downgrade no-explicit-any to warn for now.
      // Phase 1 cursor rule already enforces this at authoring time.
      // Upgrade to 'error' in a later phase once all any usage is cleaned up.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow empty object types (common in React component props scaffolding)
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
