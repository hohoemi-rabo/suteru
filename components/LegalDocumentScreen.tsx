import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { Palette } from '@/constants/Colors';

import type { LegalDocument, LegalRevision, LegalSection } from '@/lib/legal-documents';

export default function LegalDocumentScreen({
  document,
}: {
  document: LegalDocument;
}) {
  return (
    <ScreenBackground edges={['top']}>
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
    </ScreenBackground>
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
        <Ionicons name="chevron-back" size={24} color={Palette.text.primary} />
      </Pressable>
      <Text className="text-xl text-body font-bold flex-1" numberOfLines={1}>
        {title}
      </Text>
      <View className="rounded-full bg-green-100 px-2 py-0.5">
        <Text className="text-xs text-green-600">ベータ版</Text>
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
    <View className="rounded-2xl bg-blue-50 border border-blue-600/30 p-4 gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color={Palette.blue[600]} />
        <Text className="text-sm text-muted">施行日: {effectiveDate}</Text>
      </View>
      <Text className="text-sm text-body leading-relaxed">{intro}</Text>
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
      <Text className="text-lg text-body font-bold">
        {index}. {section.heading}
      </Text>
      {section.body.map((paragraph, i) => (
        <Text
          key={`p-${i}`}
          className="text-base text-body leading-relaxed"
        >
          {paragraph}
        </Text>
      ))}
      {section.bullets && section.bullets.length > 0 && (
        <View className="gap-1.5 pl-2">
          {section.bullets.map((bullet, i) => (
            <View key={`b-${i}`} className="flex-row gap-2">
              <Text className="text-base text-body">・</Text>
              <Text className="flex-1 text-base text-body leading-relaxed">
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
      <Text className="text-lg text-body font-bold">改定履歴</Text>
      <View className="rounded-xl bg-bg shadow-card overflow-hidden">
        {history.map((rev, idx) => (
          <View
            key={`${rev.date}-${idx}`}
            className={`px-4 py-3 gap-1 ${idx > 0 ? 'border-t border-line' : ''}`}
          >
            <Text className="text-sm text-muted">{rev.date}</Text>
            <Text className="text-sm text-body">{rev.note}</Text>
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
    <View className="rounded-2xl bg-line px-4 py-3 gap-2">
      <Text className="text-sm text-muted">連絡先</Text>
      <Pressable
        onPress={handlePressEmail}
        accessibilityRole="link"
        accessibilityLabel={`${email} にメールを送る`}
        className="flex-row items-center gap-2"
      >
        <Ionicons name="mail-outline" size={18} color={Palette.green[600]} />
        <Text className="flex-1 text-base text-green-600 underline">{email}</Text>
        <Ionicons name="open-outline" size={16} color={Palette.green[600]} />
      </Pressable>
    </View>
  );
}
