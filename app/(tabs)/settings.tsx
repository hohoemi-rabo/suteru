import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useData,
  useDataUpdater,
  type UpdateResult,
} from '@/lib/data-loader';
import { requestPermission } from '@/lib/notifications';
import { clearCached, STORAGE_KEYS } from '@/lib/storage';
import { useUserSettings } from '@/lib/user-settings';
import type { Area } from '@/types';

const NOTIFICATION_TIME_PRESETS = ['18:00', '19:00', '20:00', '21:00', '22:00'] as const;

export default function SettingsScreen() {
  const data = useData();
  const {
    settings,
    setAreaId,
    setNotificationsEnabled,
    setNotificationTime,
    reset,
  } = useUserSettings();
  const { isChecking, check } = useDataUpdater();

  const currentArea =
    data.areas.areas.find((a) => a.id === settings.areaId) ?? null;
  const appVersion = Constants.expoConfig?.version ?? '不明';

  // ----- 地区 -----
  const handleSelectArea = (area: Area) => {
    if (area.id === settings.areaId) return;
    Alert.alert(
      '地区変更',
      `「${area.name}」に変更しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更',
          onPress: () => {
            void setAreaId(area.id);
          },
        },
      ],
    );
  };

  // ----- 通知 -----
  const handleToggleNotifications = async (value: boolean) => {
    if (!value) {
      await setNotificationsEnabled(false);
      return;
    }
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        '通知が許可されていません',
        '端末の設定アプリ → アプリ → 通知 から「これどう捨てる？」の通知を許可してください。',
      );
      return;
    }
    await setNotificationsEnabled(true);
  };

  const handlePickTime = (time: string) => {
    if (time === settings.notificationTime) return;
    void setNotificationTime(time);
  };

  // ----- データ更新 -----
  const handleCheckUpdate = async () => {
    const result = await check();
    const messages: Record<UpdateResult, string> = {
      updated: '新しいデータをダウンロードしました。',
      'no-change': '最新のデータを使用中です。',
      'no-host': 'リモート更新は未設定です（ベータ版バンドルを使用しています）。',
      error: 'データの取得に失敗しました。電波状況をご確認ください。',
    };
    Alert.alert('データ更新', messages[result]);
  };

  // ----- アプリ情報 -----
  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };

  const handlePreparingDoc = (label: string) => {
    Alert.alert(label, '近日公開予定です。');
  };

  // ----- 開発者 -----
  const handleReset = () => {
    Alert.alert(
      '設定をリセット',
      'すべての設定値を初期化します。オンボーディングからやり直します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            void reset();
          },
        },
      ],
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'データキャッシュをクリア',
      '次回アプリ起動時にバンドル版のデータが使われます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'クリア',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearCached(STORAGE_KEYS.CACHED_DATA_BUNDLE);
              Alert.alert('完了', 'キャッシュをクリアしました。アプリを再起動してください。');
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="px-6 pt-2 pb-4">
          <Text className="text-2xl text-ink-900 font-bold">設定</Text>
        </View>

        <View className="px-4 gap-6">
          <AreaSection
            areas={data.areas.areas}
            currentAreaId={settings.areaId}
            currentArea={currentArea}
            onSelect={handleSelectArea}
          />

          <NotificationSection
            enabled={settings.notificationsEnabled}
            time={settings.notificationTime}
            onToggle={handleToggleNotifications}
            onPickTime={handlePickTime}
          />

          <DataUpdateSection
            version={data.meta.version}
            lastUpdated={data.meta.lastUpdated}
            isChecking={isChecking}
            onCheck={handleCheckUpdate}
          />

          <AppInfoSection
            appVersion={appVersion}
            officialUrl={data.meta.officialUrl}
            onPressOfficial={handleOpenOfficial}
            onPressPrivacy={() => handlePreparingDoc('プライバシーポリシー')}
            onPressTerms={() => handlePreparingDoc('利用規約')}
          />

          {__DEV__ && (
            <DeveloperSection
              onReset={handleReset}
              onClearCache={handleClearCache}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// 地区セクション
// ============================================================

function AreaSection({
  areas,
  currentAreaId,
  currentArea,
  onSelect,
}: {
  areas: Area[];
  currentAreaId: string | null;
  currentArea: Area | null;
  onSelect: (area: Area) => void;
}) {
  return (
    <View className="gap-3">
      <SectionTitle>地区</SectionTitle>
      <Text className="text-sm text-ink-500 px-1">
        現在の地区: {currentArea ? `${currentArea.name}（No.${currentArea.no}）` : '未設定'}
      </Text>

      <View className="gap-2">
        {areas.map((area) => {
          const isCurrent = area.id === currentAreaId;
          return (
            <Pressable
              key={area.id}
              onPress={() => onSelect(area)}
              accessibilityRole="button"
              accessibilityState={{ selected: isCurrent }}
              accessibilityLabel={`No.${area.no} ${area.name}${isCurrent ? '（現在の地区）' : ''}`}
              className={`min-h-11 rounded-xl border-2 p-4 flex-row items-center gap-3 ${
                isCurrent ? 'border-brand-500 bg-brand-100' : 'border-ink-200 bg-bg'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isCurrent ? 'border-brand-600 bg-brand-600' : 'border-ink-200'
                }`}
              >
                {isCurrent && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-sm text-ink-500">No.{area.no}</Text>
                <Text className="text-base text-ink-900">{area.name}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-xl bg-warn-100 px-4 py-3">
        <Text className="text-sm text-warn-600">
          ※ 上記以外のエリアは近日対応予定です。
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// 通知セクション
// ============================================================

function NotificationSection({
  enabled,
  time,
  onToggle,
  onPickTime,
}: {
  enabled: boolean;
  time: string;
  onToggle: (value: boolean) => Promise<void>;
  onPickTime: (time: string) => void;
}) {
  return (
    <View className="gap-3">
      <SectionTitle>通知</SectionTitle>

      <View className="rounded-2xl border border-ink-200 p-4 gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text className="text-base text-ink-900 font-bold">
              明日のごみ出しを通知する
            </Text>
            <Text className="text-xs text-ink-500">
              前日 {time} に「明日は○○の日です」とお知らせします
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(value) => {
              void onToggle(value);
            }}
            accessibilityLabel="明日のごみ出し通知のオン・オフ"
          />
        </View>
      </View>

      <View className="rounded-2xl border border-ink-200 p-4 gap-3">
        <Text className="text-base text-ink-900 font-bold">通知時刻</Text>
        <View className={`flex-row gap-2 ${enabled ? '' : 'opacity-50'}`}>
          {NOTIFICATION_TIME_PRESETS.map((preset) => {
            const isSelected = preset === time;
            return (
              <Pressable
                key={preset}
                onPress={() => onPickTime(preset)}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !enabled }}
                accessibilityLabel={`通知時刻 ${preset}`}
                className={`flex-1 min-h-11 rounded-xl border-2 items-center justify-center ${
                  isSelected ? 'border-brand-500 bg-brand-100' : 'border-ink-200 bg-bg'
                }`}
              >
                <Text
                  className={`text-base ${
                    isSelected ? 'text-brand-600 font-bold' : 'text-ink-900'
                  }`}
                >
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!enabled && (
          <Text className="text-xs text-ink-500">
            通知を ON にすると時刻を選べます。
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================
// データ更新セクション
// ============================================================

function DataUpdateSection({
  version,
  lastUpdated,
  isChecking,
  onCheck,
}: {
  version: string;
  lastUpdated: string;
  isChecking: boolean;
  onCheck: () => void;
}) {
  return (
    <View className="gap-3">
      <SectionTitle>データ</SectionTitle>
      <View className="rounded-2xl border border-ink-200 p-4 gap-3">
        <View className="gap-0.5">
          <Text className="text-base text-ink-900">
            データバージョン: {version}
          </Text>
          <Text className="text-xs text-ink-500">最終更新: {lastUpdated}</Text>
        </View>
        <Pressable
          onPress={onCheck}
          disabled={isChecking}
          accessibilityRole="button"
          accessibilityLabel="データ更新を確認"
          className={`min-h-11 rounded-xl px-4 py-2 items-center justify-center ${
            isChecking ? 'bg-ink-200' : 'bg-brand-500'
          }`}
        >
          <Text
            className={`text-base font-bold ${
              isChecking ? 'text-ink-500' : 'text-white'
            }`}
          >
            {isChecking ? '確認中…' : 'データ更新を確認'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// アプリ情報セクション
// ============================================================

function AppInfoSection({
  appVersion,
  officialUrl,
  onPressOfficial,
  onPressPrivacy,
  onPressTerms,
}: {
  appVersion: string;
  officialUrl: string;
  onPressOfficial: () => void;
  onPressPrivacy: () => void;
  onPressTerms: () => void;
}) {
  return (
    <View className="gap-3">
      <SectionTitle>アプリ情報</SectionTitle>
      <View className="rounded-2xl border border-ink-200 overflow-hidden">
        <InfoRow label="アプリバージョン" value={appVersion} />
        <LinkRow
          label="飯田市公式サイト"
          subtitle={officialUrl}
          icon="open-outline"
          onPress={onPressOfficial}
          borderTop
        />
        <LinkRow
          label="プライバシーポリシー"
          subtitle="準備中"
          icon="chevron-forward"
          onPress={onPressPrivacy}
          borderTop
        />
        <LinkRow
          label="利用規約"
          subtitle="準備中"
          icon="chevron-forward"
          onPress={onPressTerms}
          borderTop
        />
        <InfoRow label="運営" value="ほほ笑みラボ" borderTop />
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  borderTop,
}: {
  label: string;
  value: string;
  borderTop?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 ${
        borderTop ? 'border-t border-ink-200' : ''
      }`}
    >
      <Text className="text-base text-ink-900">{label}</Text>
      <Text className="text-base text-ink-500">{value}</Text>
    </View>
  );
}

function LinkRow({
  label,
  subtitle,
  icon,
  onPress,
  borderTop,
}: {
  label: string;
  subtitle?: string;
  icon: 'open-outline' | 'chevron-forward';
  onPress: () => void;
  borderTop?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      className={`flex-row items-center gap-3 px-4 py-3 ${
        borderTop ? 'border-t border-ink-200' : ''
      }`}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-base text-ink-900">{label}</Text>
        {subtitle && <Text className="text-xs text-ink-500">{subtitle}</Text>}
      </View>
      <Ionicons name={icon} size={18} color="#6B7280" />
    </Pressable>
  );
}

// ============================================================
// 開発者セクション（__DEV__ のみ）
// ============================================================

function DeveloperSection({
  onReset,
  onClearCache,
}: {
  onReset: () => void;
  onClearCache: () => void;
}) {
  return (
    <View className="rounded-2xl border-2 border-warn-600 p-4 gap-3">
      <Text className="text-sm text-warn-600 font-bold">開発者</Text>
      <Pressable
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel="設定をリセット"
        className="min-h-11 rounded-xl border-2 border-warn-600 px-4 py-2 items-center justify-center"
      >
        <Text className="text-base text-warn-600">
          設定をリセット（オンボーディング再表示）
        </Text>
      </Pressable>
      <Pressable
        onPress={onClearCache}
        accessibilityRole="button"
        accessibilityLabel="データキャッシュをクリア"
        className="min-h-11 rounded-xl border-2 border-warn-600 px-4 py-2 items-center justify-center"
      >
        <Text className="text-base text-warn-600">
          データキャッシュをクリア（再起動で反映）
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// 共通: セクションタイトル
// ============================================================

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-base text-ink-900 font-bold px-1">{children}</Text>
  );
}
