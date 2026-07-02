import { View } from '@tarojs/components';
import { PropsWithChildren, CSSProperties } from 'react';
import { colors, radius } from '../styles/tokens';

interface CardProps {
  style?: CSSProperties;
  bordered?: boolean;       // 是否显示细边框 (默认 true，与 RN 端 prepItem 一致)
  padding?: number;         // rpx
  onClick?: () => void;
}

export function Card({ children, style, bordered = true, padding = 24, onClick }: PropsWithChildren<CardProps>) {
  return (
    <View
      onClick={onClick}
      style={{
        backgroundColor: colors.surface,
        borderRadius: `${radius.md}rpx`,
        padding: `${padding}rpx`,
        borderWidth: bordered ? '2rpx' : '0',
        borderColor: colors.border,
        ...style,
      }}
    >
      {children}
    </View>
  );
}