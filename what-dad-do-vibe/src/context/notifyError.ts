/**
 * 用户反馈工具 - 在 AppContext 各处复用
 *
 * 在 native 平台用 Alert.alert 提示用户操作失败；
 * Web 平台 Alert.alert 不支持 button callback，自动降级到 console.error（后续可接 toast）。
 */
import { Alert, Platform } from 'react-native';

export function notifyError(action: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error);
  if (Platform.OS === 'web') {
    console.error(`[${action}]`, msg);
    return;
  }
  Alert.alert('操作失败', `${action}: ${msg}`);
}