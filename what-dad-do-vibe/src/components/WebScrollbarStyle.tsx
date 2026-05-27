import { useEffect } from 'react';
import { Platform } from 'react-native';

const css = `
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D4D0C8; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #B8B4A8; }
  * { scrollbar-width: thin; scrollbar-color: #D4D0C8 transparent; }
`;

/**
 * Web 端全局滚动条样式
 * 在文档 head 中注入 <style>
 */
export function WebScrollbarStyle() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
