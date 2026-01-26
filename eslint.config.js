import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import pluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/volumes/**',
      '**/.catpaw/**',
      '**/deploy/**',
      '**/install/**',
      '**/*.log',
      '**/pnpm-lock.yaml',
      '**/venv/**',
    ],
  },
  // 基础 JavaScript 配置
  js.configs.recommended,
  // TypeScript 配置
  ...tseslint.configs.recommended,
  // Import/Export 规则
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  // Promise 最佳实践
  pluginPromise.configs['flat/recommended'],
  // Node.js 最佳实践
  pluginN.configs['flat/recommended'],
  // Unicorn 规则
  pluginUnicorn.configs['flat/recommended'],
  // Prettier 兼容（必须放在最后）
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': 'off', // 关闭 console 语句检查
      'no-unused-vars': 'off', // 使用 TypeScript 的版本
      // Import 顺序规则
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js 内置模块
            'external', // 外部依赖
            'internal', // 内部别名模块
            ['parent', 'sibling'], // 父级和同级目录
            'index', // 当前目录的 index
            'object', // object imports
            'type', // 类型导入
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      // 关闭一些过于严格的 unicorn 规则
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/filename-case': 'off', // 关闭文件名 kebab-case 要求
      'unicorn/import-style': 'off', // 关闭导入风格要求
      'unicorn/no-process-exit': 'off', // 关闭 process.exit 限制
      'unicorn/prefer-top-level-await': 'off', // 关闭顶级 await 要求
      'unicorn/no-array-sort': 'off', // 允许使用 Array.sort()
      'unicorn/prefer-string-slice': 'off', // 允许使用 substring
      'unicorn/no-useless-switch-case': 'off', // 允许 switch 中的单一 case
      'unicorn/prefer-code-point': 'off', // 允许使用 charCodeAt
      'unicorn/prefer-spread': 'off', // 允许使用 split('')
      // 关闭 TypeScript any 类型检查
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off', // 允许使用 namespace（用于类型扩展）
      // 关闭导入解析检查（对于 .js 扩展名）
      'import/no-unresolved': 'off',
      // 关闭一些 Node.js 规则以兼容现代 ES 模块
      'n/no-unsupported-features/es-syntax': 'off',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-process-exit': 'off', // 关闭 Node.js process.exit 限制
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
