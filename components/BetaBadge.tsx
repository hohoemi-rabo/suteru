import { Text, View } from 'react-native';

import { FontSize } from '@/constants/Colors';

/**
 * 画面タイトルの右隣に置く共通「ベータ版」バッジ。
 * 指示書: 背景 green[200] / 文字 green[600] / FontSize.caption / pill / padding 3x9。
 */
export default function BetaBadge() {
  return (
    <View className="self-start rounded-full bg-green-200 px-2.5 py-0.5">
      <Text className="text-green-600 font-medium" style={{ fontSize: FontSize.caption }}>
        ベータ版
      </Text>
    </View>
  );
}
