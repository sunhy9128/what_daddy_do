import { View, Text, Input, Button, Picker, navigateBack } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../../context/AuthContext';
import { getBabies } from '../../lib/api';
import { supabase, Baby } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

const GENDERS: { value: 'male' | 'female' | 'unknown'; label: string; emoji: string }[] = [
  { value: 'unknown', label: '未知', emoji: '🤷' },
  { value: 'male',   label: '男',   emoji: '👦' },
  { value: 'female', label: '女',   emoji: '👧' },
];

function defaultDate() {
  const d = new Date(); d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

export default function BabyInfo() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate());
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Baby | null>(null);

  useEffect(() => {
    if (!user) return;
    getBabies(user.id).then(b => {
      const first = b[0];
      if (first) {
        setExisting(first);
        setName(first.name);
        setDueDate(first.due_date?.slice(0, 10) ?? defaultDate());
        setGender((first.gender ?? 'unknown') as any);
      }
    });
  }, [user]);

  const onSave = async () => {
    if (!user) return;
    if (!name.trim()) { Taro.showToast({ title: '请填写宝宝名字', icon: 'none' }); return; }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: name.trim(),
        due_date: dueDate,
        gender,
      };
      if (existing) {
        await supabase.from('babies').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('babies').insert(payload);
      }
      Taro.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => navigateBack(), 600);
    } catch (e: any) {
      Taro.showToast({ title: e?.message ?? '保存失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
        宝宝信息
      </Text>

      <Card>
        <Field label="宝宝名字">
          <Input
            value={name}
            onInput={(e: any) => setName(e.detail.value)}
            placeholder="如：小圆子"
            style={inputStyle}
          />
        </Field>

        <Field label="预产期">
          <Picker
            mode="date"
            value={dueDate}
            onChange={(e: any) => setDueDate(e.detail.value)}
          >
            <View style={{ ...inputStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.fg, fontSize: `${fontSize.body}rpx` }}>{dueDate}</Text>
              <Text style={{ color: colors.muted }}>📅</Text>
            </View>
          </Picker>
        </Field>

        <Field label="性别">
          <View style={{ flexDirection: 'row' }}>
            {GENDERS.map(g => {
              const active = g.value === gender;
              return (
                <View
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  style={{
                    flex: 1,
                    padding: `${spacing.md}rpx`,
                    borderRadius: `${radius.md}rpx`,
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderWidth: '2rpx',
                    borderColor: active ? colors.accent : colors.border,
                    alignItems: 'center',
                    marginRight: `${spacing.sm}rpx`,
                  }}
                >
                  <Text style={{ fontSize: '40rpx' }}>{g.emoji}</Text>
                  <Text style={{ color: active ? '#FFFFFF' : colors.fg, fontSize: `${fontSize.footnote}rpx`, marginTop: `${spacing.xs}rpx` }}>
                    {g.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Field>
      </Card>

      <Button
        onClick={onSave}
        loading={saving}
        style={{
          backgroundColor: colors.accent,
          color: '#FFFFFF',
          borderRadius: `${radius.md}rpx`,
          fontSize: `${fontSize.callout}rpx`,
          marginTop: `${spacing.lg}rpx`,
        }}
      >
        保存
      </Button>
    </View>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <View style={{ marginBottom: `${spacing.md}rpx` }}>
      <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.xs}rpx`, display: 'block' }}>{label}</Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: `${radius.sm}rpx`,
  borderWidth: '1rpx',
  borderColor: colors.border,
  padding: `${spacing.sm}rpx`,
  fontSize: `${fontSize.body}rpx`,
  minHeight: '72rpx',
} as const;