import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useData } from '@/lib/data-loader';
import {
  getUpcomingStationDates,
  type NextStationDate,
} from '@/lib/recycle-station-utils';
import { formatNextCollection } from '@/lib/schedule-calculator';
import { useUserSettings } from '@/lib/user-settings';
import type { Area, Facility } from '@/types';

export default function FacilitiesScreen() {
  const data = useData();
  const { settings } = useUserSettings();
  const router = useRouter();

  const area = data.areas.areas.find((a) => a.id === settings.areaId) ?? null;
  const sections = groupFacilities(data.facilities.facilities);
  const nextStation = getUpcomingStationDates(data.recycleStations)[0] ?? null;

  const handleOpenSettings = () => router.push('/(tabs)/settings');
  const handleOpenRecycleStations = () => router.push('/recycle-stations');
  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="pb-8">
        <Header area={area} onPressChange={handleOpenSettings} />

        <View className="px-4 gap-5">
          <RecycleStationLink
            next={nextStation}
            onPress={handleOpenRecycleStations}
          />

          {sections.map((section) => (
            <FacilitySection
              key={section.title}
              title={section.title}
              description={section.description}
              facilities={section.facilities}
            />
          ))}

          <Footer onPressOfficial={handleOpenOfficial} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// セクション: ヘッダー
// ============================================================

function Header({
  area,
  onPressChange,
}: {
  area: Area | null;
  onPressChange: () => void;
}) {
  return (
    <View className="px-4 pt-2 pb-4 gap-1">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-end gap-2 flex-1">
          <Text className="text-xl text-ink-900 font-bold">施設・業者</Text>
          <View className="rounded-full bg-brand-100 px-2 py-0.5">
            <Text className="text-xs text-brand-600">ベータ版</Text>
          </View>
        </View>
        <Pressable
          onPress={onPressChange}
          accessibilityLabel="地区を変更する（設定画面を開く）"
          accessibilityRole="button"
          className="flex-row items-center gap-1 rounded-full bg-brand-100 px-3 py-1.5"
        >
          <Ionicons name="location" size={14} color="#16A34A" />
          <Text className="text-sm text-brand-600">
            {area ? truncate(area.name, 8) : '地区未設定'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#16A34A" />
        </Pressable>
      </View>
      <Text className="text-sm text-ink-500">
        ごみの持ち込み先・引取業者の一覧
      </Text>
    </View>
  );
}

// ============================================================
// セクション: リサイクルステーションへのリンク（目立つ位置）
// ============================================================

function RecycleStationLink({
  next,
  onPress,
}: {
  next: NextStationDate | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="リサイクルステーションの開催日を見る"
      className="rounded-2xl bg-accent-500/10 border border-accent-500/30 p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-full bg-accent-500 items-center justify-center">
          <Ionicons name="repeat" size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base text-ink-900 font-bold">
            リサイクルステーション
          </Text>
          {next ? (
            <Text className="text-sm text-ink-900">
              次回: {formatNextCollection(next.date)}（{next.group.label} グループ）
            </Text>
          ) : (
            <Text className="text-sm text-ink-500">
              今年度の開催スケジュールを確認
            </Text>
          )}
          <Text className="text-xs text-ink-500">
            ペットボトル・ガラスびん・空き缶
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>
    </Pressable>
  );
}

// ============================================================
// セクション: 施設グループ
// ============================================================

function FacilitySection({
  title,
  description,
  facilities,
}: {
  title: string;
  description?: string;
  facilities: Facility[];
}) {
  if (facilities.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="text-base text-ink-900 font-bold">{title}</Text>
      {description && (
        <Text className="text-xs text-ink-500">{description}</Text>
      )}
      <View className="gap-2">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id + facility.name} facility={facility} />
        ))}
      </View>
    </View>
  );
}

// ============================================================
// セクション: 施設カード
// ============================================================

function FacilityCard({ facility }: { facility: Facility }) {
  const handleCall = async () => {
    const tel = `tel:${facility.phone.replace(/[^0-9+]/g, '')}`;
    try {
      await Linking.openURL(tel);
    } catch {
      Alert.alert('電話を発信できませんでした', facility.phone);
    }
  };

  const handleOpenMap = async () => {
    const query =
      facility.lat !== undefined && facility.lng !== undefined
        ? `${facility.lat},${facility.lng}`
        : encodeURIComponent(`${facility.name} ${facility.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('地図アプリを開けませんでした', url);
    }
  };

  return (
    <View className="rounded-2xl border border-ink-200 p-4 gap-3">
      <View className="gap-1">
        <Text className="text-base text-ink-900 font-bold">{facility.name}</Text>
        <Text className="text-xs text-ink-500">{facility.purpose}</Text>
      </View>

      <Pressable
        onPress={handleOpenMap}
        accessibilityRole="link"
        accessibilityLabel={`${facility.name}の住所を地図で開く`}
        className="flex-row items-start gap-2"
      >
        <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
        <Text className="flex-1 text-sm text-ink-900 leading-relaxed">
          {facility.address}
        </Text>
        <Ionicons name="open-outline" size={14} color="#16A34A" style={{ marginTop: 2 }} />
      </Pressable>

      {(facility.openDays || facility.openHours) && (
        <View className="gap-1">
          {facility.openDays && (
            <View className="flex-row items-start gap-2">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-sm text-ink-900 leading-relaxed">
                {facility.openDays}
              </Text>
            </View>
          )}
          {facility.openHours && (
            <View className="flex-row items-center gap-2">
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text className="flex-1 text-sm text-ink-900">{facility.openHours}</Text>
            </View>
          )}
        </View>
      )}

      {facility.fee && (
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={14} color="#6B7280" />
          <Text className="text-sm text-ink-900">料金: {facility.fee}</Text>
        </View>
      )}

      <Pressable
        onPress={handleCall}
        accessibilityRole="button"
        accessibilityLabel={`${facility.name}に電話する`}
        className="min-h-11 rounded-xl bg-brand-500 px-4 py-2 flex-row items-center justify-center gap-2"
      >
        <Ionicons name="call" size={18} color="#FFFFFF" />
        <Text className="text-base text-white font-bold">{facility.phone}</Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// セクション: フッター
// ============================================================

function Footer({ onPressOfficial }: { onPressOfficial: () => void }) {
  return (
    <View className="rounded-2xl bg-ink-200/30 px-4 py-3 gap-2">
      <Text className="text-xs text-ink-500 leading-relaxed">
        施設の営業時間や受入条件は変更される場合があります。事前に電話でご確認ください。
      </Text>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        className="flex-row items-center gap-1"
      >
        <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
        <Ionicons name="open-outline" size={14} color="#16A34A" />
      </Pressable>
    </View>
  );
}

// ============================================================
// ヘルパー: 施設を 3 セクションに分類
// ============================================================

interface FacilityGroup {
  title: string;
  description?: string;
  facilities: Facility[];
}

/**
 * facilities を 3 セクションに分類:
 * 1. 持ち込み施設（クリーンセンター・最終処分場）
 * 2. 資源ごみ受入業者（金属・紙）
 * 3. 家電リサイクル引取業者
 *
 * 前田産業は資源受入と家電引取の両方に登場するため、
 * id を見て後者だけ「家電リサイクル」用に再表示する。
 */
function groupFacilities(facilities: Facility[]): FacilityGroup[] {
  const dropoff = facilities.filter((f) =>
    f.purpose.includes('直接持ち込み'),
  );
  const resourceReceive = facilities.filter(
    (f) =>
      f.purpose.includes('資源ごみ') &&
      !f.purpose.includes('家電リサイクル法対象品の引取業者'),
  );
  const applianceTakeback = facilities.filter((f) =>
    f.purpose.includes('家電リサイクル法対象品の引取業者'),
  );
  // 「資源受入＋家電引取」の兼業施設は、家電セクションで「（家電引取）」と表示するため別ラベルに置換
  const applianceTakebackRenamed = applianceTakeback.map<Facility>((f) => ({
    ...f,
    purpose: f.purpose.includes('資源ごみ')
      ? '家電リサイクル法対象品の引取業者'
      : f.purpose,
  }));

  return [
    {
      title: '持ち込み施設',
      description: '大型・大量のごみを直接搬入できる施設',
      facilities: dropoff,
    },
    {
      title: '資源ごみ受入業者',
      description: '金属・紙資源を受け入れる業者',
      facilities: resourceReceive,
    },
    {
      title: '家電リサイクル引取業者',
      description: 'テレビ・冷蔵庫・洗濯機などの引取依頼先',
      facilities: applianceTakebackRenamed,
    },
  ];
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
