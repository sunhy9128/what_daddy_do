import { View, Text } from '@tarojs/components';
import { PropsWithChildren, CSSProperties } from 'react';
import { colors, spacing, fontSize } from '../styles/tokens';

interface SectionProps {
  title: string;
  count?: number;
  style?: CSSProperties;
}

export function Section({ title, count, style, children }: PropsWithChildren<SectionProps>) {
  return (
    <View style={{ marginBottom: `${spacing.lg}rpx`, ...style }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: `${spacing.sm}rpx` }}>
        <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg }}>
          {title}
        </Text>
        {typeof count === 'number' && (
          <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.muted, marginLeft: `${spacing.xs}rpx` }}>
            ({count})
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}