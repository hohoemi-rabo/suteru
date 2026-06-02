import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';

import AreaSelectorRow from '@/components/AreaSelectorRow';
import BetaBadge from '@/components/BetaBadge';
import { FontSize, Palette } from '@/constants/Colors';
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
  const handleOpenDisaster = () => router.push('/disaster-waste');
  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };

  return (
    <ScreenBackground edges={['top']} colors={[Palette.green[100], Palette.bg.surface]}>
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

          <DisasterLink onPress={handleOpenDisaster} />

          <Footer onPressOfficial={handleOpenOfficial} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

// ============================================================
// セクション: 災害時のごみへのリンク
// ============================================================

function DisasterLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="災害時のごみについて見る"
      className="rounded-2xl bg-bg shadow-card p-4 flex-row items-center gap-3"
    >
      <View className="w-11 h-11 rounded-full bg-danger-bg items-center justify-center">
        <Ionicons name="warning-outline" size={22} color={Palette.danger.text} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-base text-body font-bold">災害時のごみ</Text>
        <Text className="text-sm text-muted">
          大規模災害時のごみ出し・携帯トイレの備え
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Palette.text.secondary} />
    </Pressable>
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
    <View className="px-4 pt-2 pb-4 gap-2">
      {/* 1 行目: タイトル + ベータ版 */}
      <View className="flex-row items-center gap-2">
        <Text className="text-green-900 font-bold" style={{ fontSize: FontSize.title }}>
          施設・業者
        </Text>
        <BetaBadge />
      </View>
      {/* 2 行目: 地区セレクタ（目立つ専用行） */}
      <AreaSelectorRow area={area} onPress={onPressChange} />
      <Text className="text-muted" style={{ fontSize: FontSize.small }}>
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
      className="rounded-2xl bg-blue-50 border border-blue-600/30 p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-full bg-blue-600 items-center justify-center">
          <Ionicons name="repeat" size={22} color={Palette.bg.surface} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base text-body font-bold">
            リサイクルステーション
          </Text>
          {next ? (
            <Text className="text-sm text-body">
              次回: {formatNextCollection(next.date)}（{next.group.label} グループ）
            </Text>
          ) : (
            <Text className="text-sm text-muted">
              今年度の開催スケジュールを確認
            </Text>
          )}
          <Text className="text-sm text-muted">
            ペットボトル・ガラスびん・空き缶
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Palette.text.secondary} />
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
      <Text className="text-green-900 font-bold" style={{ fontSize: FontSize.subtitle }}>
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-muted">{description}</Text>
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
    <View className="rounded-2xl bg-bg shadow-card p-4 gap-3">
      <View className="gap-1">
        <Text className="text-body font-bold" style={{ fontSize: FontSize.subtitle }}>
          {facility.name}
        </Text>
        <Text className="text-sm text-muted">{facility.purpose}</Text>
      </View>

      <Pressable
        onPress={handleOpenMap}
        accessibilityRole="link"
        accessibilityLabel={`${facility.name}の住所を地図で開く`}
        className="flex-row items-start gap-2"
      >
        <Ionicons name="location-outline" size={18} color={Palette.text.secondary} style={{ marginTop: 2 }} />
        <Text className="flex-1 text-base text-body leading-relaxed">
          {facility.address}
        </Text>
        <Ionicons name="open-outline" size={16} color={Palette.blue[600]} style={{ marginTop: 2 }} />
      </Pressable>

      {(facility.openDays || facility.openHours) && (
        <View className="gap-1">
          {facility.openDays && (
            <View className="flex-row items-start gap-2">
              <Ionicons name="calendar-outline" size={16} color={Palette.text.secondary} style={{ marginTop: 2 }} />
              <Text className="flex-1 text-base text-body leading-relaxed">
                {facility.openDays}
              </Text>
            </View>
          )}
          {facility.openHours && (
            <View className="flex-row items-center gap-2">
              <Ionicons name="time-outline" size={16} color={Palette.text.secondary} />
              <Text className="flex-1 text-base text-body">{facility.openHours}</Text>
            </View>
          )}
        </View>
      )}

      {facility.fee && (
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={16} color={Palette.text.secondary} />
          <Text className="text-base text-body">料金: {facility.fee}</Text>
        </View>
      )}

      {facility.acceptedItems && facility.acceptedItems.length > 0 && (
        <View className="rounded-xl bg-green-50 px-3 py-2 gap-1">
          <View className="flex-row items-center gap-2">
            <Ionicons name="checkmark-circle-outline" size={16} color={Palette.text.secondary} />
            <Text className="text-sm text-muted">受入品目</Text>
          </View>
          <Text className="text-base text-body leading-relaxed">
            {facility.acceptedItems.join('・')}
          </Text>
        </View>
      )}

      <Pressable
        onPress={handleCall}
        accessibilityRole="button"
        accessibilityLabel={`${facility.name}に電話する`}
        className="min-h-11 rounded-full bg-green-400 px-4 py-2 flex-row items-center justify-center gap-2"
      >
        <Ionicons name="call" size={18} color={Palette.bg.surface} />
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
    <View className="rounded-2xl bg-bg border border-line px-4 py-3 gap-2">
      <Text className="text-sm text-muted leading-relaxed">
        施設の営業時間や受入条件は変更される場合があります。事前に電話でご確認ください。
      </Text>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        className="flex-row items-center gap-0.5 self-start"
      >
        <Text className="text-sm text-blue-600 underline">公式サイトで確認</Text>
        <Ionicons name="chevron-forward" size={13} color={Palette.blue[600]} />
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
