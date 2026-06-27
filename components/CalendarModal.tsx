import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScheduleCalendar from '@/components/ScheduleCalendar';
import { FontSize, Palette } from '@/constants/Colors';
import type { CollectionCategoryId, Pattern } from '@/types';

/**
 * 収集カレンダーをポップアップ（下から出るボトムシート）で表示するモーダル。
 *
 * - 既存の `ScheduleCalendar` をそのまま再利用（月送り・色ドット・凡例つき）
 * - 新規ルートを増やさず、現在の画面に重ねて出す＝シームレスな一体感
 * - `pattern` が無い（地区未設定 / パターン準備中）ときは案内を表示
 */
export default function CalendarModal({
  visible,
  onClose,
  pattern,
  categoryLabelMap,
  categoryColorMap,
}: {
  visible: boolean;
  onClose: () => void;
  pattern: Pattern | undefined;
  categoryLabelMap: Record<CollectionCategoryId, string>;
  categoryColorMap: Record<CollectionCategoryId, string>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 背景の暗幕。タップで閉じる */}
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="カレンダーを閉じる"
      >
        {/* シート本体（中身のタップは閉じないよう responder を奪う） */}
        <View
          className="rounded-t-3xl"
          style={{ backgroundColor: Palette.green[100], maxHeight: '88%' }}
          onStartShouldSetResponder={() => true}
        >
          {/* つまみ */}
          <View className="items-center pt-3">
            <View className="w-12 h-1.5 rounded-full bg-line" />
          </View>

          {/* ヘッダー（タイトル + 閉じる） */}
          <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={20} color={Palette.green[400]} />
              <Text className="text-green-900 font-bold" style={{ fontSize: FontSize.subtitle }}>
                収集カレンダー
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="閉じる"
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <Ionicons name="close" size={24} color={Palette.text.primary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 24,
            }}
          >
            {pattern ? (
              <ScheduleCalendar
                pattern={pattern}
                categoryLabelMap={categoryLabelMap}
                categoryColorMap={categoryColorMap}
              />
            ) : (
              <View className="rounded-2xl bg-danger-bg p-5 gap-2">
                <Text className="text-base text-danger font-bold">
                  カレンダーを表示できません
                </Text>
                <Text className="text-sm text-body leading-relaxed">
                  地区が未設定か、このエリアの収集パターンが準備中です。設定から地区を選ぶと表示できます。
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}
