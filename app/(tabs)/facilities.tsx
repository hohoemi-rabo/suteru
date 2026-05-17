import { SafeAreaView, Text, View } from 'react-native';

export default function FacilitiesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-xl text-ink-900">施設</Text>
        <Text className="mt-2 text-sm text-ink-500">画面作成予定（docs/19_facilities_screen.md）</Text>
      </View>
    </SafeAreaView>
  );
}
