import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { type ColorValue, type LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type Shared = {
  heights: SharedValue<number[]>;
  /** Index of the row being dragged, or -1. */
  active: SharedValue<number>;
  /** Index the dragged row would land on if dropped now. */
  target: SharedValue<number>;
  dragY: SharedValue<number>;
};

type Props<T> = {
  data: readonly T[];
  keyExtractor: (item: T) => string;
  /** The row's content, shown to the right of the drag handle. */
  renderItem: (item: T, index: number) => React.ReactNode;
  onMove: (from: number, to: number) => void;
  /** Called when a drag starts and ends, so the page can stop scrolling meanwhile. */
  onDragChange?: (dragging: boolean) => void;
  /** Spoken name for an item, used by the handle's screen reader label. */
  itemLabel: (item: T) => string;
  rowBackground: ColorValue;
  borderColor: ColorValue;
  handleColor: ColorValue;
};

/**
 * A vertical list whose rows can be dragged into a new order by their handle.
 * Works with touch on iOS and Android, and with a mouse or touch on the web.
 * Screen reader users get "Move up" and "Move down" actions on the handle.
 */
export function ReorderableList<T>({
  data,
  keyExtractor,
  renderItem,
  onMove,
  onDragChange,
  itemLabel,
  rowBackground,
  borderColor,
  handleColor,
}: Props<T>) {
  const heights = useSharedValue<number[]>([]);
  const active = useSharedValue(-1);
  const target = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const shared = useMemo<Shared>(() => ({ heights, active, target, dragY }), [heights, active, target, dragY]);

  const keys = data.map(keyExtractor);
  const keysId = keys.join('|');
  const measured = useRef(new Map<string, number>());

  const publishHeights = useCallback(() => {
    heights.value = keysId.split('|').map((k) => measured.current.get(k) ?? 0);
  }, [heights, keysId]);
  useEffect(publishHeights, [publishHeights]);

  // Once the new order is on screen, put every row back to its natural place.
  useLayoutEffect(() => {
    active.value = -1;
    target.value = -1;
    dragY.value = 0;
  }, [keysId, active, target, dragY]);

  const onLayout = useCallback(
    (key: string, height: number) => {
      if (measured.current.get(key) === height) return;
      measured.current.set(key, height);
      publishHeights();
    },
    [publishHeights]
  );

  // Keep the gesture callbacks stable, so re-renders during a drag don't rebuild the gesture.
  const latest = useRef({ onMove, onDragChange });
  latest.current = { onMove, onDragChange };
  const move = useCallback((from: number, to: number) => latest.current.onMove(from, to), []);
  const dragStart = useCallback(() => latest.current.onDragChange?.(true), []);
  const dragCancel = useCallback(() => latest.current.onDragChange?.(false), []);
  const drop = useCallback((from: number, to: number) => {
    latest.current.onDragChange?.(false);
    if (from !== to) latest.current.onMove(from, to);
  }, []);

  return (
    <View>
      {data.map((item, i) => (
        <Row
          key={keys[i]}
          itemKey={keys[i]}
          index={i}
          count={data.length}
          label={itemLabel(item)}
          shared={shared}
          onLayout={onLayout}
          onDragStart={dragStart}
          onDragCancel={dragCancel}
          onDrop={drop}
          onMove={move}
          rowBackground={rowBackground}
          borderColor={borderColor}
          handleColor={handleColor}>
          {renderItem(item, i)}
        </Row>
      ))}
    </View>
  );
}

type RowProps = {
  itemKey: string;
  index: number;
  count: number;
  label: string;
  shared: Shared;
  onLayout: (key: string, height: number) => void;
  onDragStart: () => void;
  onDragCancel: () => void;
  onDrop: (from: number, to: number) => void;
  onMove: (from: number, to: number) => void;
  rowBackground: ColorValue;
  borderColor: ColorValue;
  handleColor: ColorValue;
  children: React.ReactNode;
};

function Row({
  itemKey,
  index,
  count,
  label,
  shared,
  onLayout,
  onDragStart,
  onDragCancel,
  onDrop,
  onMove,
  rowBackground,
  borderColor,
  handleColor,
  children,
}: RowProps) {
  const { heights, active, target, dragY } = shared;

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin(() => {
          scheduleOnRN(onDragStart);
        })
        .onStart(() => {
          active.value = index;
          target.value = index;
          dragY.value = 0;
        })
        .onUpdate((e) => {
          if (active.value !== index) return;
          const hs = heights.value;
          let start = 0;
          for (let k = 0; k < index; k++) start += hs[k] ?? 0;
          let total = 0;
          for (let k = 0; k < hs.length; k++) total += hs[k] ?? 0;
          const own = hs[index] ?? 0;
          const y = Math.min(Math.max(e.translationY, -start), total - start - own);
          dragY.value = y;
          // The row under the dragged row's middle is where it would land.
          const middle = start + y + own / 2;
          let top = 0;
          let t = hs.length - 1;
          for (let k = 0; k < hs.length; k++) {
            if (middle < top + (hs[k] ?? 0)) {
              t = k;
              break;
            }
            top += hs[k] ?? 0;
          }
          target.value = t;
        })
        .onFinalize(() => {
          if (active.value !== index) {
            // A tap on the handle that never turned into a drag.
            scheduleOnRN(onDragCancel);
            return;
          }
          const hs = heights.value;
          const to = target.value;
          let settle = 0;
          if (to > index) for (let k = index + 1; k <= to; k++) settle += hs[k] ?? 0;
          if (to < index) for (let k = to; k < index; k++) settle -= hs[k] ?? 0;
          dragY.value = withTiming(settle, { duration: 140 }, () => {
            if (to === index) active.value = -1;
            scheduleOnRN(onDrop, index, to);
          });
        }),
    [index, heights, active, target, dragY, onDragStart, onDragCancel, onDrop]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const a = active.value;
    if (a === index) {
      return { transform: [{ translateY: dragY.value }], zIndex: 2, elevation: 6, shadowOpacity: 0.18 };
    }
    const t = target.value;
    const h = a >= 0 ? (heights.value[a] ?? 0) : 0;
    let offset = 0;
    if (a >= 0 && a < index && index <= t) offset = -h;
    if (a >= 0 && t <= index && index < a) offset = h;
    // Snap back instantly once nothing is being dragged, so the new order doesn't jump.
    return {
      transform: [{ translateY: a >= 0 ? withTiming(offset, { duration: 160 }) : 0 }],
      zIndex: 0,
      elevation: 0,
      shadowOpacity: 0,
    };
  });

  const onA11yAction = useCallback(
    (e: { nativeEvent: { actionName: string } }) => {
      if (e.nativeEvent.actionName === 'moveUp' && index > 0) onMove(index, index - 1);
      if (e.nativeEvent.actionName === 'moveDown' && index < count - 1) onMove(index, index + 1);
    },
    [index, count, onMove]
  );

  return (
    <Animated.View
      onLayout={(e: LayoutChangeEvent) => onLayout(itemKey, e.nativeEvent.layout.height)}
      style={[
        styles.row,
        { backgroundColor: rowBackground },
        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor },
        animatedStyle,
      ]}>
      <GestureDetector gesture={gesture}>
        <View
          style={styles.handle}
          accessible
          accessibilityLabel={`Reorder ${label}`}
          accessibilityActions={[
            { name: 'moveUp', label: 'Move up' },
            { name: 'moveDown', label: 'Move down' },
          ]}
          onAccessibilityAction={onA11yAction}>
          <Text style={[styles.grip, { color: handleColor }]} selectable={false}>
            ≡
          </Text>
        </View>
      </GestureDetector>
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  handle: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'grab', touchAction: 'none', userSelect: 'none' } as object) : null),
  },
  grip: { fontSize: 22, lineHeight: 24 },
});
