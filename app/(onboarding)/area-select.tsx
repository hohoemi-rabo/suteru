import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';

import { useData } from '@/lib/data-loader';
import { useUserSettings } from '@/lib/user-settings';

export default function AreaSelectScreen() {
  const { areas } = useData().areas;
  const { setAreaId } = useUserSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleNext = async () => {
    if (!selectedId) return;
    await setAreaId(selectedId);
    router.replace('/(onboarding)/notifications');
  };

  return (
    <ScreenBackground edges={['top', 'bottom']}>
      <View className="px-6 pt-6 pb-2 gap-1">
        <Text className="text-sm text-ink-500">1 / 2</Text>
        <Text className="text-2xl text-ink-900 font-bold">お住まいの地区を選んでください</Text>
        <Text className="text-sm text-ink-500">
          選んだ地区の収集日とルールが表示されます。後から変更できます。
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-6 py-4 gap-3">
        {areas.map((area) => {
          const isSelected = area.id === selectedId;
          return (
            <Pressable
              key={area.id}
              onPress={() => setSelectedId(area.id)}
              className={`min-h-11 rounded-xl border-2 p-4 flex-row items-center gap-3 ${
                isSelected ? 'border-brand-500 bg-brand-100' : 'border-ink-200 bg-bg'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? 'border-brand-600 bg-brand-600' : 'border-ink-200'
                }`}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-sm text-ink-500">No.{area.no}</Text>
                <Text className="text-base text-ink-900">{area.name}</Text>
              </View>
            </Pressable>
          );
        })}

        <View className="mt-2 rounded-xl bg-warn-100 px-4 py-3">
          <Text className="text-sm text-warn-600">
            ※ 上記以外のエリアは近日対応予定です。
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-6 pt-2 border-t border-ink-200">
        <Pressable
          onPress={handleNext}
          disabled={!selectedId}
          className={`min-h-11 rounded-xl px-6 py-3 items-center justify-center ${
            selectedId ? 'bg-brand-500' : 'bg-ink-200'
          }`}
        >
          <Text className={`text-lg font-bold ${selectedId ? 'text-white' : 'text-ink-500'}`}>
            次へ
          </Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}
