import Taro from '@tarojs/taro';

/** 统一路由封装，避免在页面里散落 switchTab / navigateTo */
export const router = {
  /** tabBar 页面（已在 app.config.ts 的 tabBar.list 里） */
  switchTab(path: string) {
    return Taro.switchTab({ url: path });
  },
  /** 普通页面跳转 */
  navigateTo(path: string) {
    return Taro.navigateTo({ url: path });
  },
  /** 重定向（无返回栈） */
  redirectTo(path: string) {
    return Taro.redirectTo({ url: path });
  },
  /** 返回上一页 */
  navigateBack(delta = 1) {
    return Taro.navigateBack({ delta });
  },
};

/** 是否为 tabBar 页面 */
const TAB_PAGES = new Set([
  '/pages/index/index',
  '/pages/tasks/index',
  '/pages/community/index',
  '/pages/profile/index',
]);

export function goTo(path: string) {
  return TAB_PAGES.has(path) ? router.switchTab(path) : router.navigateTo(path);
}