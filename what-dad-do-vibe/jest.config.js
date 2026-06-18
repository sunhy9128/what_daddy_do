/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // 项目中的 React Native/Expo 依赖在纯逻辑测试中不需要 mock，
  // 但如果测试文件 import 了含 RN 依赖的模块，需要在这里 mock
  moduleNameMapper: {
    // 官方 AsyncStorage mock（jest 环境的 in-memory 实现）
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
  // verbose 输出能看到每个测试组的详细信息
  verbose: true,
};
