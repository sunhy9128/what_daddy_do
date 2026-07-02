import { defineConfig } from '@tarojs/cli';
import { WeappH5Config } from '@tarojs/taro/types/compile';

export default defineConfig({
  projectName: 'what-dad-do-wechat',
  date: '2026-7-2',
  designWidth: 750,
  deviceRatio: { 640: 2.34 / 2, 750: 1, 828: 1.81 / 2, 375: 2 / 1 },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-framework-react'],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: 'react',
  compiler: 'webpack5',
  cache: { enable: false },
  sass: { resource: [] },
  mini: {
    webpackChain(chain: any) {},
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    output: { filename: 'js/[name].[hash:8].js', chunkFilename: 'js/[name].[chunkhash:8].js' },
    miniCssExtractPluginOption: { ignoreOrder: true, filename: 'css/[name].[hash].css' },
    postcss: { autoprefixer: { enable: true } },
    devServer: { port: 10086, host: '0.0.0.0' },
  } as Partial<WeappH5Config>,
});