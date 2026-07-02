import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Switch, Dimensions, FlatList, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { useApp } from '../../src/context/AppContext';
import { useColors, useTheme } from '../../src/context/ThemeContext';
import { Card } from '../../src/components/atoms';
import { STAGES, calculateStageFromDueDate, calculateBirthAge } from '../../src/lib/stages';
import { spacing, radius, typography } from '../../src/styles/tokens';
import { loadNotificationConfig, saveNotificationConfig, NotificationConfig } from '../../src/lib/storage';
import { requestNotificationPermissions, scheduleDailyCheckinReminder, cancelAllNotifications } from '../../src/lib/notifications';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { state } = useApp();
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();

  const activeBabies = state.babies.filter(b => !b.is_archived);

  // 翻页布局：
  //   - 父容器宽度 = SCREEN_WIDTH（满屏）
  //   - 翻页步长 STEP_WIDTH = SCREEN_WIDTH - 2 * spacing.lg
  //   - 单张卡片宽度 = STEP_WIDTH
  //   - 卡片之间间距通过在卡片上加 marginHorizontal: GAP/2 实现，
  //     卡片实际渲染时左右各 GAP/2 = spacing.md/2，整页两端的额外边距由父容器 padding 控制
  // 结果：每张卡片左/右到屏幕边缘的距离 = spacing.lg + GAP/2，对称一致。
  const STEP_WIDTH = useMemo(() => Dimensions.get('window').width - spacing.lg * 2, []);
  const GAP = spacing.md; // 卡片之间视觉间距
  const CARD_WIDTH = STEP_WIDTH;

  const [signingOut, setSigningOut] = useState(false);
  const [babyPageIndex, setBabyPageIndex] = useState(0);
  const [notifConfig, setNotifConfig] = useState<NotificationConfig | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);

  // Load notification config
  useEffect(() => {
    if (user?.id) {
      loadNotificationConfig(user.id).then(setNotifConfig);
    }
  }, [user?.id]);

  const handleNotifToggle = useCallback(async (key: keyof NotificationConfig, value: boolean) => {
    if (!user?.id || !notifConfig) return;
    const updated = { ...notifConfig, [key]: value };
    setNotifConfig(updated);
    await saveNotificationConfig(user.id, updated);

    // Request permission if enabling notifications
    if (key === 'enabled' && value) {
      await requestNotificationPermissions();
    }

    // If enabling daily checkin, schedule it; if disabling, cancel all
    if (key === 'checkinEnabled') {
      if (value) {
        await scheduleDailyCheckinReminder({ hour: updated.checkinHour, minute: updated.checkinMinute });
      } else {
        await cancelAllNotifications();
      }
    }
  }, [user?.id, notifConfig]);

  // 滚动到指定宝宝卡片
  const scrollToBaby = useCallback((index: number) => {
    if (index < 0 || index >= activeBabies.length) return;
    isScrolling.current = true;
    setBabyPageIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
    // 等待滚动动画结束后释放守卫
    setTimeout(() => { isScrolling.current = false; }, 600);
  }, [activeBabies.length]);

  // 使用可见项变化检测当前页（忽略滚动过程中的中间回调）
  const onBabyViewable = useCallback(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (isScrolling.current) return;
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setBabyPageIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // 进入页面时滚动到当前选中的宝宝（只在首次加载时执行）
  const hasInitialized = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      const currentIdx = activeBabies.findIndex(b => b.id === state.currentBabyId);
      if (currentIdx >= 0 && flatListRef.current) {
        setBabyPageIndex(currentIdx);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: currentIdx, animated: false });
        }, 100);
      }
    }, [activeBabies, state.currentBabyId])
  );

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      if (Platform.OS === 'web') { window.alert('退出失败，请重试'); } else { Alert.alert('退出失败', '请重试'); }
    } finally {
      setSigningOut(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg },

    // 头像
    profile: { alignItems: 'center', paddingVertical: spacing.xxl },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarText: { fontSize: 28, color: '#fff', fontWeight: '600' },
    email: { ...typography.callout, color: colors.fg },

    // 分区
    section: { marginBottom: spacing.lg },
    sectionTitle: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // 菜单卡片
    menuCard: {
      marginBottom: spacing.sm,
      marginHorizontal: 0,
      padding: 0,
      borderRadius: radius.sm,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.md,
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    menuIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuText: { ...typography.callout, color: colors.fg },
    menuBadge: { ...typography.footnote, color: colors.accent, fontWeight: '500' },
    menuRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    menuStatusText: { ...typography.footnote, color: colors.fgSecondary },
    menuSubText: { ...typography.footnote, marginTop: 2 },

    // 二级菜单 Modal
    sheetContainer: { flex: 1 },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetClose: { ...typography.callout, fontWeight: '500', width: 40, textAlign: 'left' },
    sheetTitle: { ...typography.headline, fontWeight: '600' },
    sheetHint: { ...typography.footnote, marginBottom: spacing.md },

    // 孕期信息卡片（滑页内用）
    pregCard: {
      backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
      borderWidth: 0.5, borderColor: colors.border,
      alignItems: 'center',
    },
    pregHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    pregIcon: {
      width: 36, height: 36, borderRadius: radius.sm,
      backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center',
    },
    pregTitle: { ...typography.headline, fontWeight: '600', color: colors.fg },
    pregRow: {
      flexDirection: 'row', justifyContent: 'space-between', width: '100%',
      paddingVertical: spacing.sm,
    },
    pregLabel: { ...typography.callout, color: colors.fgSecondary },
    pregValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
    pregDivider: {
      width: '100%', height: StyleSheet.hairlineWidth, backgroundColor: colors.border,
    },

    // 宝宝信息卡片（滑页内用）
    babyCard: {
      backgroundColor: colors.babyCardBg, borderRadius: radius.lg, padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1, borderColor: colors.babyCardBorder,
    },
    babyHeader: { alignItems: 'center', marginBottom: spacing.md },
    babyNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    babyName: { ...typography.title2, fontWeight: '700', color: colors.babyName },
    babyStage: {
      fontSize: 11, fontWeight: '600', color: '#fff',
      backgroundColor: colors.babyAccent, paddingHorizontal: spacing.sm, paddingVertical: 2,
      borderRadius: radius.sm, overflow: 'hidden',
    },
    babyInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
    babyInfoText: { ...typography.callout, color: colors.genderUnknown },
    cardSettings: {
      position: 'absolute', top: spacing.sm, right: spacing.sm,
      width: 32, height: 32, borderRadius: radius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
    },
    babyTagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    babyTag: {
      backgroundColor: isDark ? '#2A2E4A' : '#E8F0FE', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    babyTagText: { fontSize: 12, fontWeight: '500', color: colors.accent },

    // 退出
    logoutBtn: {
      marginTop: spacing.md,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
      alignItems: 'center',
    },
    logoutText: { ...typography.callout, fontWeight: '500', color: colors.dangerFg },

    // 分页指示器（匹配工具箱样式）
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { width: 24, borderRadius: 4, backgroundColor: colors.accent },
    dotInactive: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    pageBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pageBtnDisabled: {
      opacity: 0.25,
    },
  }), [colors, isDark]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 头像区域 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email || '未登录'}</Text>
        </View>

        {/* 多宝宝信息卡片 - 左右滑动 */}
        {(activeBabies.length > 0 || state.loading) && (
          <>
            <View style={{ width: STEP_WIDTH }}>
              {state.loading ? (
                <View style={[styles.babyCard, { justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={activeBabies}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  onViewableItemsChanged={onBabyViewable}
                  viewabilityConfig={viewabilityConfig}
                  getItemLayout={(_, index) => ({ length: STEP_WIDTH, offset: STEP_WIDTH * index, index })}
                  renderItem={({ item, index }) => {
                const isLast = index === activeBabies.length - 1;
                const cardWidth = CARD_WIDTH;
                const calc = calculateStageFromDueDate(item.dueDate);
                const isPostpartum = calc.stage === 'postpartum';
                const birthAgeLabel = isPostpartum ? calculateBirthAge(item.dueDate, item.birthDate) : '';

                if (isPostpartum) {
                  return (
                    <View style={{ width: STEP_WIDTH, marginHorizontal: GAP / 2 }}>
                      <View style={{ width: cardWidth }}>
                        <View style={styles.babyCard}>
                          <TouchableOpacity style={styles.cardSettings} onPress={() => router.push(`/baby-info?babyId=${item.id}`)}>
                            <Ionicons name="settings-outline" size={16} color={colors.muted} />
                          </TouchableOpacity>
                          <View style={styles.babyHeader}>
                            {item.gender === 'girl' ? (
                              <Ionicons name="female" size={48} color={colors.babyGirl} style={{ marginBottom: spacing.sm }} />
                            ) : item.gender === 'boy' ? (
                              <Ionicons name="male" size={48} color={colors.babyBoy} style={{ marginBottom: spacing.sm }} />
                            ) : (
                              <Ionicons name="help-circle-outline" size={48} color={colors.genderUnknown} style={{ marginBottom: spacing.sm }} />
                            )}
                            <View style={styles.babyNameRow}>
                              <Text style={styles.babyName}>{item.name || '宝宝'}</Text>
                              <Text style={styles.babyStage}>已出生</Text>
                            </View>
                          </View>
                          {item.birthDate && (
                            <View style={styles.babyInfoRow}>
                              <Ionicons name="gift-outline" size={14} color={colors.warning} />
                              <Text style={styles.babyInfoText}>出生日期：{item.birthDate}</Text>
                            </View>
                          )}
                          <View style={styles.babyInfoRow}>
                            <Ionicons name="time-outline" size={14} color={colors.warning} />
                            <Text style={styles.babyInfoText}>宝宝 {birthAgeLabel}</Text>
                          </View>
                          <View style={styles.babyTagRow}>
                            <View style={styles.babyTag}><Text style={styles.babyTagText}>{item.gender === 'girl' ? '女宝' : item.gender === 'boy' ? '男宝' : '未知'}</Text></View>
                            <View style={[styles.babyTag, { backgroundColor: colors.warningSurface }]}><Text style={[styles.babyTagText, { color: colors.warning }]}><Ionicons name="gift-outline" size={12} color={colors.warning} /> {item.birthDate || item.dueDate}</Text></View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }
                return (
                  <View style={{ width: STEP_WIDTH, marginHorizontal: GAP / 2 }}>
                    <View style={{ width: cardWidth }}>
                      <View style={styles.pregCard}>
                      <TouchableOpacity style={styles.cardSettings} onPress={() => router.push(`/baby-info?babyId=${item.id}`)}>
                        <Ionicons name="settings-outline" size={16} color={colors.muted} />
                      </TouchableOpacity>
                      <View style={styles.pregHeader}>
                        <View style={styles.pregIcon}>
                          <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                        </View>
                        <Text style={styles.pregTitle}>{item.name || '宝宝'} 孕期信息</Text>
                      </View>
                      <View style={styles.pregRow}>
                        <Text style={styles.pregLabel}>当前阶段</Text>
                        <Text style={styles.pregValue}>{calc.stageLabel}</Text>
                      </View>
                      <View style={styles.pregDivider} />
                      <View style={styles.pregRow}>
                        <Text style={styles.pregLabel}>当前孕周</Text>
                        <Text style={styles.pregValue}>第 {calc.weeksPregnant} 周</Text>
                      </View>
                      <View style={styles.pregDivider} />
                      <View style={styles.pregRow}>
                        <Text style={styles.pregLabel}>预产期</Text>
                        <Text style={styles.pregValue}>{item.dueDate || '-'}</Text>
                      </View>
                    </View>
                    </View>
                  </View>
                );
                }}
              />
            )}
            </View>
            {/* 分页指示器 */}
            {activeBabies.length > 1 && (
              <View style={styles.dotsContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, babyPageIndex === 0 && styles.pageBtnDisabled]}
                  onPress={() => scrollToBaby(babyPageIndex - 1)}
                  disabled={babyPageIndex === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={babyPageIndex === 0 ? colors.muted : colors.accent} />
                </TouchableOpacity>

                {activeBabies.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dot,
                      index === babyPageIndex && styles.dotActive,
                    ]}
                    onPress={() => scrollToBaby(index)}
                    activeOpacity={0.7}
                  />
                ))}

                <TouchableOpacity
                  style={[styles.pageBtn, babyPageIndex >= activeBabies.length - 1 && styles.pageBtnDisabled]}
                  onPress={() => scrollToBaby(babyPageIndex + 1)}
                  disabled={babyPageIndex >= activeBabies.length - 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={16} color={babyPageIndex >= activeBabies.length - 1 ? colors.muted : colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* 账号菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/profile-edit')}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="person-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>个人资料</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 关于菜单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>使用帮助</Text>
              </View>
            </TouchableOpacity>
          </Card>
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>关于我们</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 显示设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>显示</Text>
          <Card style={styles.menuCard}>
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>深色模式</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.switchTrackOff, true: colors.accentLight }}
                thumbColor={isDark ? colors.accent : colors.surface}
              />
            </View>
          </Card>
        </View>

        {/* 通知设置 — 一级入口 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.6}
              onPress={() => setNotifModalOpen(true)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="notifications-outline" size={18} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>通知设置</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuStatusText}>
                  {notifConfig?.enabled ? '已开启' : '已关闭'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.fgSecondary} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          {signingOut ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.logoutText}>退出登录</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ===== 通知设置二级菜单 ===== */}
      <Modal
        visible={notifModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotifModalOpen(false)}
      >
        <View style={[styles.sheetContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={() => setNotifModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.sheetClose, { color: colors.accent }]}>完成</Text>
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.fg }]}>通知设置</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
            <Text style={[styles.sheetHint, { color: colors.fgSecondary }]}>
              关闭通知后，将不会收到任何推送提醒
            </Text>
            <Card style={styles.menuCard}>
              {/* 主开关 */}
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="notifications-outline" size={18} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.menuText}>接收通知</Text>
                    <Text style={[styles.menuSubText, { color: colors.fgSecondary }]}>总开关</Text>
                  </View>
                </View>
                <Switch
                  value={notifConfig?.enabled ?? true}
                  onValueChange={(v) => handleNotifToggle('enabled', v)}
                  trackColor={{ false: colors.switchTrackOff, true: colors.accentLight }}
                  thumbColor={(notifConfig?.enabled ?? true) ? colors.accent : colors.surface}
                />
              </View>

              {/* 子开关：仅在主开关开启时可用 */}
              {[
                {
                  key: 'checkinEnabled' as const,
                  label: '每日打卡提醒',
                  desc: '提醒完成今日打卡任务',
                  icon: 'checkbox-outline',
                },
                {
                  key: 'prenatalEnabled' as const,
                  label: '产检提醒',
                  desc: '产检前 1 天推送提醒',
                  icon: 'medkit-outline',
                },
                {
                  key: 'vaccineEnabled' as const,
                  label: '疫苗提醒',
                  desc: '疫苗接种日前推送提醒',
                  icon: 'bandage-outline',
                },
              ].map((item, idx, arr) => {
                const enabled = notifConfig?.enabled ?? true;
                const checked = (notifConfig?.[item.key] ?? true) && enabled;
                return (
                  <View
                    key={item.key}
                    style={[
                      styles.menuRow,
                      idx < arr.length - 1 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.divider,
                      },
                      !enabled && { opacity: 0.4 },
                    ]}
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                        <Ionicons name={item.icon as any} size={18} color={colors.accent} />
                      </View>
                      <View>
                        <Text style={styles.menuText}>{item.label}</Text>
                        <Text style={[styles.menuSubText, { color: colors.fgSecondary }]}>{item.desc}</Text>
                      </View>
                    </View>
                    <Switch
                      value={checked}
                      disabled={!enabled}
                      onValueChange={(v) => handleNotifToggle(item.key, v)}
                      trackColor={{ false: colors.switchTrackOff, true: colors.accentLight }}
                      thumbColor={checked ? colors.accent : colors.surface}
                    />
                  </View>
                );
              })}
            </Card>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
