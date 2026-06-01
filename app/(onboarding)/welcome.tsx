import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';

export default function WelcomeScreen() {
  return (
    <ScreenBackground edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-16 pb-8 items-center justify-between">
        <View className="items-center gap-6 mt-12">
          <View className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center">
            <Ionicons name="leaf" size={56} color="#166534" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-3xl text-ink-900 font-bold">これどう捨てる？</Text>
            <Text className="text-base text-ink-500 text-center">
              飯田市のごみ分別を、写真一枚で。
            </Text>
          </View>
          <View className="rounded-full bg-brand-100 px-4 py-1">
            <Text className="text-brand-600 text-sm">ベータ版</Text>
          </View>
        </View>

        <View className="w-full gap-4">
          <Text className="text-sm text-ink-500 text-center">
            設定の前に、お住まいの地区を選んでいただきます。
          </Text>
          <Pressable
            onPress={() => router.push('/(onboarding)/area-select')}
            className="min-h-11 rounded-full bg-brand-500 px-6 py-3 items-center justify-center"
          >
            <Text className="text-lg text-white font-bold">はじめる</Text>
          </Pressable>
        </View>
      </View>
    </ScreenBackground>
  );
}
