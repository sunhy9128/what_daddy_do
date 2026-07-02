import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../../context/AuthContext';
import { getBabies } from '../../lib/api';
import { Baby } from '../../lib/supabase';
import { calculateStageFromDueDate, calculateBirthAge } from '../../lib/stages';
import { goTo } from '../../lib/router';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [checkin, setCheckin] = useState(true);
  const [prenatal, setPrenatal] = useState(true);
  const [vaccine, setVaccine] = useState(true);

  useEffect(() => {
    if (!user) return;
    getBabies(user.id).then(b => {
      setBabies(b);
      setLoading(false);
    });
  }, [user]);

  const handleSignOut = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
      success: (res) => { if (res.confirm) signOut(); },
    });
  };

  if (loading) {
    return <View style={{ padding: `${spacing.lg}rpx` }}><Text>加载中…</Text></View>;
  }

  const active = babies[activeIdx];

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      {/* 用户信息卡 */}
      <Card style={{ marginBottom: `${spacing.md}rpx` }}>
        <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary }}>已登录</Text>
        <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, fontWeight: '500', marginTop: `${spacing.xs}rpx`, display: 'block' }}>
          {user?.email}
        </Text>
      </Card>

      {/* 宝宝信息卡（左右对称间距） */}
      {babies.length > 0 && active && (
        <View style={{ marginBottom: `${spacing.lg}rpx` }}>
          <View
            onClick={() => goTo('/pages/profile/baby-info')}
            style={{
              backgroundColor: colors.surface,
              borderRadius: `${radius.md}rpx`,
              padding: `${spacing.lg}rpx`,
              borderWidth: '2rpx',
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg }}>
              {active.name}
            </Text>
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
              预产期：{active.due_date?.slice(0, 10) ?? '未设置'}
            </Text>
            {(() => {
              const s = calculateStageFromDueDate(active.due_date);
              return (
                <Text style={{ fontSize: `${fontSize.body}rpx`, color: colors.accent, fontWeight: '500', marginTop: `${spacing.sm}rpx`, display: 'block' }}>
                  {s.stage === 'postpartum' ? `宝宝 ${calculateBirthAge(active.due_date, active.birth_date)}` :
                    s.weeksPregnant > 0 ? `孕 ${s.weeksPregnant} 周` : '备孕期'}
                </Text>
              );
            })()}
            {babies.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: `${spacing.md}rpx` }}>
                {babies.map((_, i) => (
                  <View
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      width: i === activeIdx ? '32rpx' : '16rpx',
                      height: '8rpx',
                      borderRadius: '4rpx',
                      backgroundColor: i === activeIdx ? colors.accent : colors.divider,
                      marginHorizontal: `${spacing.xs / 2}rpx`,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* 菜单区 */}
      <Card style={{ marginBottom: `${spacing.md}rpx`, padding: 0 }}>
        <MenuRow icon="📝" label="宝宝信息" onClick={() => goTo('/pages/profile/baby-info')} />
        <Divider />
        <MenuRow
          icon="🔔"
          label="通知设置"
          right={notifEnabled ? '已开启' : '已关闭'}
          onClick={() => setNotifOpen(true)}
        />
      </Card>

      <Card style={{ marginBottom: `${spacing.md}rpx`, padding: 0 }}>
        <MenuRow icon="📖" label="使用帮助" onClick={() => Taro.showToast({ title: '敬请期待', icon: 'none' })} />
        <Divider />
        <MenuRow icon="💬" label="意见反馈" onClick={() => Taro.showToast({ title: '敬请期待', icon: 'none' })} />
        <Divider />
        <MenuRow icon="ℹ️" label="关于" onClick={() => Taro.showToast({ title: '爸爸去哪了 v0.1.0', icon: 'none' })} />
      </Card>

      <View
        onClick={handleSignOut}
        style={{
          backgroundColor: colors.surface,
          borderRadius: `${radius.md}rpx`,
          padding: `${spacing.md}rpx`,
          borderWidth: '2rpx',
          borderColor: colors.border,
          alignItems: 'center',
          marginTop: `${spacing.lg}rpx`,
        }}
      >
        <Text style={{ color: colors.danger, fontSize: `${fontSize.callout}rpx`, fontWeight: '500' }}>退出登录</Text>
      </View>

      {/* 通知设置二级页 */}
      <Modal visible={notifOpen} onClose={() => setNotifOpen(false)} title="通知设置">
        <View style={{ padding: `${spacing.md}rpx` }}>
          <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
            关闭通知后，将不会收到任何推送提醒
          </Text>
          <Card style={{ marginBottom: `${spacing.md}rpx`, padding: 0 }}>
            <ToggleRow icon="🔔" label="接收通知" sub="总开关" value={notifEnabled} onChange={setNotifEnabled} />
            <Divider />
            <ToggleRow icon="✅" label="每日打卡提醒" sub="提醒完成今日打卡任务"
              value={notifEnabled && checkin} disabled={!notifEnabled} onChange={setCheckin} />
            <Divider />
            <ToggleRow icon="🩺" label="产检提醒" sub="产检前 1 天推送提醒"
              value={notifEnabled && prenatal} disabled={!notifEnabled} onChange={setPrenatal} />
            <Divider />
            <ToggleRow icon="💉" label="疫苗提醒" sub="疫苗接种日前推送提醒"
              value={notifEnabled && vaccine} disabled={!notifEnabled} onChange={setVaccine} />
          </Card>
        </View>
      </Modal>
    </View>
  );
}

// ===== 子组件 =====

function MenuRow({ icon, label, right, onClick }: { icon: string; label: string; right?: string; onClick?: () => void }) {
  return (
    <View
      onClick={onClick}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: `${spacing.md}rpx`,
      }}
    >
      <Text style={{ fontSize: '32rpx', marginRight: `${spacing.md}rpx` }}>{icon}</Text>
      <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, flex: 1 }}>{label}</Text>
      {right && <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginRight: `${spacing.xs}rpx` }}>{right}</Text>}
      <Text style={{ color: colors.muted, fontSize: `${fontSize.footnote}rpx` }}>›</Text>
    </View>
  );
}

function ToggleRow({ icon, label, sub, value, disabled, onChange }: {
  icon: string; label: string; sub: string; value: boolean; disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: `${spacing.md}rpx`, opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ fontSize: '32rpx', marginRight: `${spacing.md}rpx` }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg }}>{label}</Text>
        <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: '2rpx', display: 'block' }}>{sub}</Text>
      </View>
      <Switch checked={value} disabled={disabled} onChange={onChange} />
    </View>
  );
}

function Divider() {
  return <View style={{ height: '1rpx', backgroundColor: colors.divider, marginLeft: `${spacing.md + 32 + spacing.md}rpx` }} />;
}

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <View
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '80rpx',
        height: '44rpx',
        borderRadius: '22rpx',
        backgroundColor: checked ? colors.accent : colors.switchTrackOff,
        padding: '4rpx',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: '36rpx',
          height: '36rpx',
          borderRadius: '18rpx',
          backgroundColor: '#FFFFFF',
          transform: checked ? 'translateX(36rpx)' : 'translateX(0rpx)',
        }}
      />
    </View>
  );
}