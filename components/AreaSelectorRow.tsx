import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import type { Area } from '@/types';

/**
 * ヘッダー共通の「現在の地区」行。地区名をフル表示し、タップで地区変更（設定画面）へ。
 * ホーム / 施設 / 収集日 のヘッダーで使い回す。
 */
export default function AreaSelectorRow({
  area,
  onPress,
}: {
  area: Area | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`現在の地区: ${area?.name ?? '未設定'}、タップで変更`}
      className="flex-row items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3"
    >
      <Ionicons name="location" size={18} color={Palette.blue[600]} />
      <View className="flex-1 shrink">
        <Text className="text-xs text-blue-600">現在の地区</Text>
        <Text className="text-base text-blue-900 font-bold" numberOfLines={1}>
          {area ? area.name : '地区が未設定です'}
        </Text>
      </View>
      <Text className="text-sm text-blue-600 font-bold shrink-0">変更</Text>
      <Ionicons name="chevron-forward" size={16} color={Palette.blue[600]} />
    </Pressable>
  );
}
