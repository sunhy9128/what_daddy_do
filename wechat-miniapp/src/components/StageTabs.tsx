import { View, Text } from '@tarojs/components';
import { colors, spacing, fontSize, radius } from '../styles/tokens';

interface StageTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function StageTabs({ tabs, active, onChange }: StageTabsProps) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: `${radius.full}rpx`,
        padding: `${spacing.xs / 2}rpx`,
        marginVertical: `${spacing.sm}rpx`,
      }}
    >
      {tabs.map(tab => {
        const isActive = tab === active;
        return (
          <View
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              flex: 1,
              padding: `${spacing.sm}rpx ${spacing.md}rpx`,
              borderRadius: `${radius.full}rpx`,
              backgroundColor: isActive ? colors.accent : 'transparent',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                fontSize: `${fontSize.footnote}rpx`,
                color: isActive ? '#FFFFFF' : colors.fgSecondary,
                fontWeight: isActive ? '600' : '400',
              }}
            >
              {tab}
            </Text>
          </View>
        );
      })}
    </View>
  );
}