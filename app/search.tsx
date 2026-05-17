import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useData } from '@/lib/data-loader';
import { searchItems, type ItemHit } from '@/lib/text-search';
import type { CategoriesData, CategoryId, Item } from '@/types';

export default function SearchScreen() {
  const data = useData();
  const [query, setQuery] = useState('');

  const colorMap = buildCategoryColorMap(data.categories);
  const nameMap = buildCategoryNameMap(data.categories);
  const hits = searchItems(data.items.items, query);

  const handleBack = () => router.back();

  const handleClear = () => setQuery('');

  const handleSelectItem = (item: Item) => {
    router.push({
      pathname: '/result',
      params: { identifiedName: item.name, source: 'search' },
    });
  };

  const handleOpenOfficial = async () => {
    try {
      await Linking.openURL(data.meta.officialUrl);
    } catch {
      Alert.alert('リンクを開けませんでした', data.meta.officialUrl);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <Header onPressBack={handleBack} />
      <View className="px-4 gap-4 flex-1">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={handleClear}
        />

        <ScrollView
          contentContainerClassName="pb-8 gap-4"
          keyboardShouldPersistTaps="handled"
        >
          {query.trim() === '' ? (
            <EmptyHint />
          ) : hits.length === 0 ? (
            <NoResults onPressOfficial={handleOpenOfficial} />
          ) : (
            <ResultList
              hits={hits}
              colorMap={colorMap}
              nameMap={nameMap}
              onPressItem={handleSelectItem}
            />
          )}

          <Footer onPressOfficial={handleOpenOfficial} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// セクション: ヘッダー
// ============================================================

function Header({ onPressBack }: { onPressBack: () => void }) {
  return (
    <View className="flex-row items-center gap-2 px-2 pt-2 pb-4">
      <Pressable
        onPress={onPressBack}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        className="w-11 h-11 items-center justify-center rounded-full"
      >
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </Pressable>
      <Text className="text-xl text-ink-900 font-bold flex-1">品目を探す</Text>
      <View className="rounded-full bg-brand-100 px-2 py-0.5 mr-2">
        <Text className="text-xs text-brand-600">ベータ版</Text>
      </View>
    </View>
  );
}

// ============================================================
// セクション: 検索バー
// ============================================================

function SearchBar({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2 min-h-12 rounded-xl border border-ink-200 bg-bg px-4">
      <Ionicons name="search" size={20} color="#6B7280" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="品目名で探す（例: ペットボトル）"
        placeholderTextColor="#9CA3AF"
        autoFocus
        returnKeyType="search"
        accessibilityLabel="品目名検索"
        className="flex-1 text-base text-ink-900 py-3"
      />
      {value.length > 0 && (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="入力をクリア"
          className="w-8 h-8 items-center justify-center rounded-full"
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
  );
}

// ============================================================
// セクション: 結果リスト
// ============================================================

function ResultList({
  hits,
  colorMap,
  nameMap,
  onPressItem,
}: {
  hits: ItemHit[];
  colorMap: Record<CategoryId, string>;
  nameMap: Record<CategoryId, string>;
  onPressItem: (item: Item) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm text-ink-500 px-1">{hits.length} 件</Text>
      <View className="rounded-2xl border border-ink-200 overflow-hidden">
        {hits.map((hit, idx) => (
          <Pressable
            key={hit.item.name}
            onPress={() => onPressItem(hit.item)}
            accessibilityRole="button"
            accessibilityLabel={`${hit.item.name}、${nameMap[hit.item.categoryId] ?? ''}`}
            className={`flex-row items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-ink-200' : ''}`}
          >
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colorMap[hit.item.categoryId] ?? '#6B7280' }}
            />
            <View className="flex-1 gap-0.5">
              <Text className="text-base text-ink-900">{hit.item.name}</Text>
              <Text className="text-xs text-ink-500">
                {nameMap[hit.item.categoryId] ?? hit.item.categoryId}
                {hit.matchedField === 'alias' && '（別名で一致）'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// セクション: 空時 / 0 件時
// ============================================================

function EmptyHint() {
  return (
    <View className="rounded-2xl bg-ink-200/30 px-4 py-6 gap-2">
      <Text className="text-base text-ink-900">品目名や別名で探せます。</Text>
      <Text className="text-sm text-ink-500">
        例: ペットボトル / おむつ / 電池 / 蛍光灯
      </Text>
    </View>
  );
}

function NoResults({ onPressOfficial }: { onPressOfficial: () => void }) {
  return (
    <View className="rounded-2xl border border-ink-200 p-5 gap-3">
      <Text className="text-base text-ink-900 font-bold">
        該当する品目が見つかりません
      </Text>
      <Text className="text-sm text-ink-500 leading-relaxed">
        別の言い方でお試しください。
        どうしても分からない場合は飯田市公式サイトをご確認ください。
      </Text>
      <Pressable
        onPress={onPressOfficial}
        accessibilityRole="link"
        className="flex-row items-center gap-1 self-start"
      >
        <Text className="text-sm text-brand-600 underline">飯田市公式サイトを開く</Text>
        <Ionicons name="open-outline" size={14} color="#16A34A" />
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
        辞書はベータ版です。最新の正式情報は飯田市公式サイトをご確認ください。
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
// ヘルパー: カテゴリ ID → name / color マップ
// ============================================================

function buildCategoryColorMap(data: CategoriesData): Record<CategoryId, string> {
  return data.categories.reduce<Record<CategoryId, string>>((acc, c) => {
    acc[c.id] = c.color;
    return acc;
  }, {} as Record<CategoryId, string>);
}

function buildCategoryNameMap(data: CategoriesData): Record<CategoryId, string> {
  return data.categories.reduce<Record<CategoryId, string>>((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<CategoryId, string>);
}
