import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { spacing, typography } from '../../styles/tokens';

const ACTION_WIDTH = 84;
const TRIGGER_DISTANCE = 60;
const CLAIM_DISTANCE = 16;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type SwipeActionsProps = {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  rightColor?: string;
  /** 容器样式（卡片形态可覆盖圆角/描边/阴影） */
  wrapStyle?: StyleProp<ViewStyle>;
  /** 可滑动内容样式（卡牌形态需要撑满高度） */
  contentStyle?: StyleProp<ViewStyle>;
};

// 左滑触发 onSwipeLeft（右侧露出右标签），右滑触发 onSwipeRight（左侧露出左标签）
function SwipeActions({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = '删除',
  rightLabel = '完成',
  rightColor,
  wrapStyle,
  contentStyle,
}: SwipeActionsProps) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const swallowClickRef = useRef(false);
  const wrapRef = useRef<View>(null);

  // Web 上 RN 的 onPress 由浏览器原生 click 事件触发（PressResponder.onClick）：
  // 滑动松手后浏览器会在同一元素派发 click，卡片的 toggle 会被再次执行
  // （如已完成物品被切成未完成）。滑动被接管后吞掉紧随的 click；
  // 新的按下会重置标记，正常点按不受影响。
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node: any = wrapRef.current;
    if (!node || typeof node.addEventListener !== 'function') return;
    const onMouseDown = () => { swallowClickRef.current = false; };
    const onClick = (e: MouseEvent) => {
      if (swallowClickRef.current) {
        swallowClickRef.current = false;
        e.stopPropagation();
        e.preventDefault();
      }
    };
    node.addEventListener('mousedown', onMouseDown, true);
    node.addEventListener('click', onClick, true);
    return () => {
      node.removeEventListener('mousedown', onMouseDown, true);
      node.removeEventListener('click', onClick, true);
    };
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    wrap: { borderRadius: 10, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
    backdrop: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', pointerEvents: 'none' },
    action: {
      width: ACTION_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    actionLeft: { backgroundColor: colors.error },
    actionRight: { backgroundColor: rightColor || colors.accent },
    actionText: { ...typography.caption1, fontWeight: '600', color: '#fff' },
  }), [colors, rightColor]);

  const springBack = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER, bounciness: 0 }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > CLAIM_DISTANCE && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderMove: (_e, g) => {
          translateX.setValue(Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, g.dx)));
        },
        onPanResponderGrant: () => {
          swallowClickRef.current = true;
        },
        onPanResponderRelease: (_e, g) => {
          // 先弹回原位再触发动作，避免 confirm 弹窗期间卡片停在滑出位置
          if (g.dx <= -TRIGGER_DISTANCE && onSwipeLeft) {
            springBack();
            onSwipeLeft();
          } else if (g.dx >= TRIGGER_DISTANCE && onSwipeRight) {
            springBack();
            onSwipeRight();
          } else {
            springBack();
          }
        },
        onPanResponderTerminate: springBack,
        // 滑动动作优先于父级横向翻页，避免拖到一半被翻页抢走
        onPanResponderTerminationRequest: () => false,
      }),
    [onSwipeLeft, onSwipeRight],
  );

  const leftOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, 0, ACTION_WIDTH],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  const rightOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, 0, ACTION_WIDTH],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  return (
    <View ref={wrapRef} style={[styles.wrap, wrapStyle]}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.action, styles.actionLeft, { opacity: leftOpacity }]}>
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionText}>{leftLabel}</Text>
        </Animated.View>
        <Animated.View style={[styles.action, styles.actionRight, { opacity: rightOpacity }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.actionText}>{rightLabel}</Text>
        </Animated.View>
      </View>
      <Animated.View style={[contentStyle, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

export { SwipeActions };
export default SwipeActions;
