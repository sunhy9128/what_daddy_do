import { useLayoutEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Web 端全局滚动条样式 + 主题背景同步
 *
 * 双保险机制：
 * 1. 模块加载时立即注入 <style> + 直接设置 html/body style（先于 React 渲染）
 * 2. useLayoutEffect 在浏览器绘制前同步更新主题色（无闪烁）
 */

const LIGHT_BG = '#F5F0E8';
const DARK_BG = '#121220';

// ───── 模块级：立即注入 ─────

// 方式 A: <style> 标签注入
const STATIC_CSS = `
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D4D0C8; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #B8B4A8; }
  * { scrollbar-width: thin; scrollbar-color: #D4D0C8 transparent; }

  /* 主题背景同步 — 利用 CSS 自定义属性 */
  html { background-color: var(--dadcare-bg, ${LIGHT_BG}) !important; }
  body { margin: 0 !important; padding: 0 !important; background-color: var(--dadcare-bg, ${LIGHT_BG}) !important; }
  #root, #root > div { background-color: var(--dadcare-bg, ${LIGHT_BG}) !important; }
`;

let injected = false;

function injectStyle() {
  if (injected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  injected = true;

  // 方式 B: 直接设置内联样式（确保即使 style 标签被覆盖也生效）
  const html = document.documentElement;
  const body = document.body;
  if (html) {
    html.style.setProperty('--dadcare-bg', LIGHT_BG);
    html.style.backgroundColor = LIGHT_BG;
    html.style.margin = '0';
    html.style.padding = '0';
  }
  if (body) {
    body.style.backgroundColor = LIGHT_BG;
    body.style.margin = '0';
    body.style.padding = '0';
  }

  // 方式 A: <style> 注入
  if (document.head) {
    const existing = document.getElementById('dadcare-global-style');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'dadcare-global-style';
      style.textContent = STATIC_CSS;
      document.head.appendChild(style);
    }
  }
}

injectStyle();

function setThemeBg(isDark: boolean) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const bgColor = isDark ? DARK_BG : LIGHT_BG;
  const html = document.documentElement;
  const body = document.body;
  // 更新 CSS 变量
  html?.style.setProperty('--dadcare-bg', bgColor);
  // 直接设置内联样式兜底
  if (html) html.style.backgroundColor = bgColor;
  if (body) body.style.backgroundColor = bgColor;
}

export function WebScrollbarStyle({ isDark }: { isDark: boolean }) {
  const prevDark = useRef(false);

  useLayoutEffect(() => {
    if (isDark !== prevDark.current) {
      prevDark.current = isDark;
      setThemeBg(isDark);
    }
  }, [isDark]);

  return null;
}
