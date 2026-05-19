import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LegalDocument, LegalRevision, LegalSection } from '@/lib/legal-documents';

export default function LegalDocumentScreen({
  document,
}: {
  document: LegalDocument;
}) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <Header title={document.title} onPressBack={() => router.back()} />
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <IntroBlock
          effectiveDate={document.effectiveDate}
          intro={document.intro}
        />
        {document.sections.map((section, idx) => (
          <SectionBlock
            key={`${section.heading}-${idx}`}
            index={idx + 1}
            section={section}
          />
        ))}
        <RevisionHistoryBlock history={document.revisionHistory} />
        <ContactBlock email={document.contactEmail} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// セクション: ヘッダー
// ============================================================

function Header({
  title,
  onPressBack,
}: {
  title: string;
  onPressBack: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2 px-2 pt-2 pb-3">
      <Pressable
        onPress={onPressBack}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        className="w-11 h-11 items-center justify-center rounded-full"
      >
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </Pressable>
      <Text className="text-xl text-ink-900 font-bold flex-1" numberOfLines={1}>
        {title}
      </Text>
      <View className="rounded-full bg-brand-100 px-2 py-0.5">
        <Text className="text-xs text-brand-600">ベータ版</Text>
      </View>
    </View>
  );
}

// ============================================================
// セクション: イントロ（施行日 + 説明文）
// ============================================================

function IntroBlock({
  effectiveDate,
  intro,
}: {
  effectiveDate: string;
  intro: string;
}) {
  return (
    <View className="rounded-2xl bg-accent-500/10 border border-accent-500/30 p-4 gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color="#0EA5E9" />
        <Text className="text-sm text-ink-500">施行日: {effectiveDate}</Text>
      </View>
      <Text className="text-sm text-ink-900 leading-relaxed">{intro}</Text>
    </View>
  );
}

// ============================================================
// セクション: 各章
// ============================================================

function SectionBlock({
  index,
  section,
}: {
  index: number;
  section: LegalSection;
}) {
  return (
    <View className="gap-2">
      <Text className="text-lg text-ink-900 font-bold">
        {index}. {section.heading}
      </Text>
      {section.body.map((paragraph, i) => (
        <Text
          key={`p-${i}`}
          className="text-base text-ink-900 leading-relaxed"
        >
          {paragraph}
        </Text>
      ))}
      {section.bullets && section.bullets.length > 0 && (
        <View className="gap-1.5 pl-2">
          {section.bullets.map((bullet, i) => (
            <View key={`b-${i}`} className="flex-row gap-2">
              <Text className="text-base text-ink-900">・</Text>
              <Text className="flex-1 text-base text-ink-900 leading-relaxed">
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================
// セクション: 改定履歴
// ============================================================

function RevisionHistoryBlock({ history }: { history: LegalRevision[] }) {
  if (history.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="text-lg text-ink-900 font-bold">改定履歴</Text>
      <View className="rounded-xl border border-ink-200 overflow-hidden">
        {history.map((rev, idx) => (
          <View
            key={`${rev.date}-${idx}`}
            className={`px-4 py-3 gap-1 ${idx > 0 ? 'border-t border-ink-200' : ''}`}
          >
            <Text className="text-sm text-ink-500">{rev.date}</Text>
            <Text className="text-sm text-ink-900">{rev.note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// セクション: 連絡先（mailto リンク）
// ============================================================

function ContactBlock({ email }: { email: string }) {
  const handlePressEmail = async () => {
    const url = `mailto:${email}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('メールアプリを開けませんでした', email);
    }
  };

  return (
    <View className="rounded-2xl bg-ink-200/30 px-4 py-3 gap-2">
      <Text className="text-sm text-ink-500">連絡先</Text>
      <Pressable
        onPress={handlePressEmail}
        accessibilityRole="link"
        accessibilityLabel={`${email} にメールを送る`}
        className="flex-row items-center gap-2"
      >
        <Ionicons name="mail-outline" size={18} color="#166534" />
        <Text className="flex-1 text-base text-brand-600 underline">{email}</Text>
        <Ionicons name="open-outline" size={16} color="#166534" />
      </Pressable>
    </View>
  );
}
