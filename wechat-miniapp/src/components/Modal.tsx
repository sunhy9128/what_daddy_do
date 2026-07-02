import { View, Text, ScrollView } from '@tarojs/components';
import { PropsWithChildren } from 'react';
import { colors, spacing, fontSize, radius } from '../styles/tokens';

interface ModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 全屏 Modal 弹层 — 用作二级页容器
 * 模仿 RN 端 Profile 页的通知 Modal (iOS presentationStyle=pageSheet)
 */
export function Modal({ visible, title, onClose, children }: PropsWithChildren<ModalProps>) {
  if (!visible) return null;
  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bg,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.md}rpx ${spacing.lg}rpx`,
          backgroundColor: colors.surface,
          borderBottomWidth: '1rpx',
          borderBottomColor: colors.divider,
        }}
      >
        <View
          onClick={onClose}
          style={{ padding: `${spacing.xs}rpx ${spacing.sm}rpx` }}
        >
          <Text style={{ color: colors.accent, fontSize: `${fontSize.callout}rpx` }}>完成</Text>
        </View>
        <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg }}>{title ?? ''}</Text>
        <View style={{ width: '80rpx' }} />
      </View>
      <ScrollView scrollY style={{ flex: 1 }}>
        {children}
      </ScrollView>
    </View>
  );
}