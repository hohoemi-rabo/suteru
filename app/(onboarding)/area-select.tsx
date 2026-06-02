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
        <Text className="text-sm text-muted">1 / 2</Text>
        <Text className="text-2xl text-body font-bold">お住まいの地区を選んでください</Text>
        <Text className="text-sm text-muted">
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
                isSelected ? 'border-green-400 bg-green-100' : 'border-line bg-bg'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? 'border-green-600 bg-green-600' : 'border-line'
                }`}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-sm text-muted">No.{area.no}</Text>
                <Text className="text-base text-body">{area.name}</Text>
              </View>
            </Pressable>
          );
        })}

        <View className="mt-2 rounded-xl bg-danger-bg px-4 py-3">
          <Text className="text-sm text-danger">
            ※ 上記以外のエリアは近日対応予定です。
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-6 pt-2 border-t border-line">
        <Pressable
          onPress={handleNext}
          disabled={!selectedId}
          className={`min-h-11 rounded-full px-6 py-3 items-center justify-center ${
            selectedId ? 'bg-green-400' : 'bg-line'
          }`}
        >
          <Text className={`text-lg font-bold ${selectedId ? 'text-white' : 'text-muted'}`}>
            次へ
          </Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}
