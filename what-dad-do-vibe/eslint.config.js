// ESLint flat config (ESLint 9+) for what-dad-do-vibe
// 基于 Expo 官方 eslint-config-expo 的 flat config
// https://github.com/expo/expo/tree/main/packages/eslint-config-expo
const expoConfig = require('eslint-config-expo/flat');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  // Expo 推荐的预设（TypeScript + React + React Native + Import）
  ...expoConfig,

  // 关闭与 Prettier 冲突的规则（必须放在最后）
  prettierConfig,

  // 项目级 ignore 规则
  {
    ignores: [
      // 构建产物
      'dist/**',
      '.expo/**',
      '.expo-cache/**',
      'android/**',  // expo prebuild 生成，外部维护
      // 依赖
      'node_modules/**',
      // 测试相关
      'coverage/**',
      // Expo 生成文件
      'src/lib/api.js',
      'src/lib/supabase.js',
      // 公共忽略
      '**/*.bak',
      '**/*.tsbuildinfo',
    ],
  },

  // Node.js scripts（scripts/ 下的 .js 文件使用 Node 全局变量）
  {
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'off',  // Node 解析器自己处理
    },
  },

  // 项目级 TypeScript 规则覆盖（需要重新注册 @typescript-eslint 插件）
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // 关闭与项目约定不符的规则
      'no-console': 'off',                    // 允许 console.error
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // 现有代码中已有一些'@typescript-eslint/no-explicit-any'，先 warn 不阻断
      '@typescript-eslint/no-explicit-any': 'warn',
      // React 18+ 新 JSX runtime
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Import / TypeScript
      'import/no-unresolved': 'off',  // 一些 React Native/Expo 模块解析器不识别
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
];
