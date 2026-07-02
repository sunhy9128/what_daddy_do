import { View, Text } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBabies, getPresetItems, getUserPreparations, togglePreparation, getPsychologicalSupport } from '../../lib/api';
import { Baby, PresetItem, PsychologicalSupport } from '../../lib/supabase';
import { calculateStageFromDueDate } from '../../lib/stages';
import { useUserTools } from '../../hooks/useUserTools';
import { TOOLS, ToolId } from '../../lib/tools-config';
import { Card } from '../../components/Card';
import { Section } from '../../components/Section';
import { goTo } from '../../lib/router';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

const STAGE_COLOR: Record<string, string> = {
  preconception: '#F0DCC0',
  first: '#F5C6C0',
  second: '#C8DCC4',
  third: '#A8C6D9',
  postpartum: '#E5C8E0',
};

const TOOL_PAGE: Record<ToolId, string> = {
  feeding: '/pages/tools/feeding',
  growth: '/pages/tools/growth',
  vaccine: '/pages/tools/vaccine',
  food: '/pages/tools/food',
  weight: '/pages/tools/weight',
  mood: '/pages/tools/mood',
  prenatal: '/pages/tools/prenatal',
  ai: '/pages/tools/ai',
};

export default function Index() {
  const { user } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [presetItems, setPresetItems] = useState<PresetItem[]>([]);
  const [preparations, setPreparations] = useState<UserPreparation[]>([]);
  const [supports, setSupports] = useState<PsychologicalSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const { tools } = useUserTools(user?.id);

  useLoad(() => { console.log('首页 loaded'); });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [babyList, prepMap, supportList] = await Promise.all([
          getBabies(user.id),
          getUserPreparations(user.id).catch(() => []),
          getPsychologicalSupport().catch(() => []),
        ]);
        setBabies(babyList);
        setPreparations(prepMap);
        setSupports(supportList);
        if (babyList[0]) {
          const stage = calculateStageFromDueDate(babyList[0].due_date).stage;
          const items = await getPresetItems(stage).catch(() => []);
          setPresetItems(items);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const completedSet = useMemo(
    () => new Set(preparations.filter(p => p.completed).map(p => p.preset_item_id)),
    [preparations]
  );

  const onToggleItem = async (item: PresetItem) => {
    if (!user) return;
    const next = !completedSet.has(item.id);
    setPreparations(prev => {
      const existing = prev.find(p => p.preset_item_id === item.id);
      if (existing) return prev.map(p => p.preset_item_id === item.id ? { ...p, completed: next } : p);
      return [...prev, { id: Date.now(), user_id: user.id, preset_item_id: item.id, completed: next }];
    });
    await togglePreparation(user.id, item.id, next);
  };

  if (loading) {
    return <View style={{ padding: `${spacing.lg}rpx` }}><Text>加载中…</Text></View>;
  }

  const primary = babies[0];
  const stage = primary ? calculateStageFromDueDate(primary.due_date) : null;
  const stageColor = stage ? STAGE_COLOR[stage.stage] : colors.surface;

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      {/* 阶段信息卡 */}
      <View
        style={{
          backgroundColor: stageColor,
          borderRadius: `${radius.lg}rpx`,
          padding: `${spacing.lg}rpx`,
          marginBottom: `${spacing.lg}rpx`,
        }}
      >
        <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg }}>
          {primary?.name ?? '宝宝'}
        </Text>
        {stage && (
          <Text style={{ fontSize: `${fontSize.body}rpx`, color: colors.fg, marginTop: `${spacing.sm}rpx`, display: 'block' }}>
            {stage.weeksPregnant > 0 && `孕 ${stage.weeksPregnant} 周`}
            {stage.daysToDue > 0 && ` · 距预产期 ${stage.daysToDue} 天`}
            {stage.stage === 'postpartum' && ' · 已出生'}
            {stage.stage === 'preconception' && ' · 备孕期'}
          </Text>
        )}
      </View>

      {/* 物品准备 */}
      {presetItems.length > 0 && (
        <Section title="物品准备" count={presetItems.length}>
          {presetItems.map(item => {
            const done = completedSet.has(item.id);
            return (
              <View
                key={item.id}
                onClick={() => onToggleItem(item)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: `${radius.md}rpx`,
                  padding: `${spacing.md}rpx`,
                  borderWidth: '2rpx',
                  borderColor: colors.border,
                  marginBottom: `${spacing.sm}rpx`,
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: done ? 0.55 : 1,
                }}
              >
                <View
                  style={{
                    width: '40rpx',
                    height: '40rpx',
                    borderRadius: '20rpx',
                    borderWidth: '2rpx',
                    borderColor: done ? colors.accent : colors.border,
                    backgroundColor: done ? colors.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: `${spacing.md}rpx`,
                  }}
                >
                  {done && <Text style={{ color: '#FFFFFF', fontSize: '22rpx', lineHeight: '22rpx' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '500', color: colors.fg }}>
                    {item.title}
                  </Text>
                  {item.category && (
                    <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
                      {item.category}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* 心理支持 */}
      {supports.length > 0 && (
        <Section title="心理支持" count={supports.length}>
          {supports.slice(0, 3).map(s => (
            <Card key={s.id} style={{ marginBottom: `${spacing.sm}rpx` }}>
              <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '500', color: colors.fg }}>
                {s.title}
              </Text>
              {s.content && (
                <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block', lineHeight: '1.5' }}>
                  {s.content.length > 80 ? `${s.content.slice(0, 80)}…` : s.content}
                </Text>
              )}
            </Card>
          ))}
        </Section>
      )}

      {/* 工具栏 */}
      <Section title="工具">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: `-${spacing.xs}rpx` }}>
          {tools.map(id => {
            const meta = TOOLS.find(t => t.id === id);
            if (!meta) return null;
            return (
              <View
                key={id}
                onClick={() => goTo(TOOL_PAGE[id])}
                style={{
                  width: '33.333%',
                  padding: `${spacing.xs}rpx`,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: `${radius.md}rpx`,
                    padding: `${spacing.md}rpx`,
                    borderWidth: '2rpx',
                    borderColor: colors.border,
                    alignItems: 'center',
                    minHeight: '160rpx',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: '48rpx', lineHeight: '56rpx' }}>{meta.emoji}</Text>
                  <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fg, fontWeight: '500', marginTop: `${spacing.xs}rpx` }}>
                    {meta.title}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Section>
    </View>
  );
}