import { SafeAreaView, Text, View } from 'react-native';

export default function ScheduleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-xl text-ink-900">収集日</Text>
        <Text className="mt-2 text-sm text-ink-500">画面作成予定（docs/18_schedule_screen.md）</Text>
      </View>
    </SafeAreaView>
  );
}
