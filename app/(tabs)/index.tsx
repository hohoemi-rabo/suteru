import { SafeAreaView, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl text-ink-900 font-bold">これどう捨てる？</Text>
        <Text className="mt-2 text-base text-ink-500">飯田市のごみ分別を、写真一枚で。</Text>
        <View className="mt-8 rounded-2xl bg-brand-100 px-6 py-4">
          <Text className="text-brand-600 text-lg">ベータ版 - 開発中</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
