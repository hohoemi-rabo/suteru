import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ScreenBackground from '@/components/ScreenBackground';
import { Palette } from '@/constants/Colors';

/**
 * 災害時のごみ・携帯トイレに関する案内（飯田市ごみ出しガイドブック P36 由来）。
 * 施設画面から push で開く。平常時は見ないが、防災情報として収録。
 */
export default function DisasterWasteScreen() {
  return (
    <ScreenBackground edges={['top']}>
      <Header onPressBack={() => router.back()} />
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <IntroCard />

        <Section
          index={1}
          heading="市からの情報を確認"
          body={[
            '大規模災害時も、家庭の生活ごみの収集は通常どおり継続します。一方、災害で壊れた家電や建物などの「災害廃棄物」は別ルートで回収し、被災状況に応じて仮置場を設置します。',
            '排出方法・分別方法・収集期間・仮置場などの情報は、安心安全メール・防災無線・いいだFM・ケーブルテレビ・市公式サイト・飯田市公式LINE・ごみ分別アプリ「さんあ〜る」などで発信されます。',
          ]}
        />

        <Section
          index={2}
          heading="通常のごみは通常どおり"
          body={[
            '災害時も、生活ごみは普段どおりの分別・指定袋・集積所・収集曜日で出してください。',
            '処理施設や周辺の被災状況により、リサイクルステーションの一時停止や分別・収集の変更が必要になった場合は、市から情報が発信されます。',
          ]}
        />

        <Section
          index={3}
          heading="携帯トイレを備蓄しましょう"
          body={[
            '断水や下水道の断裂でトイレが使えなくなる事態に備え、携帯トイレの備蓄が有効です。',
            '備蓄の目安は最低3日分、推奨は1週間分以上（大人のトイレ回数は1日およそ5回）。',
            '使用済みの携帯トイレ（便袋）は燃やすごみが基本ですが、収集方法は災害時に改めて市から案内されます。',
          ]}
        />

        <Footer />
      </ScrollView>
    </ScreenBackground>
  );
}

function Header({ onPressBack }: { onPressBack: () => void }) {
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
        災害時のごみ
      </Text>
      <View className="rounded-full bg-green-100 px-2 py-0.5 mr-2">
        <Text className="text-xs text-green-600">ベータ版</Text>
      </View>
    </View>
  );
}

function IntroCard() {
  return (
    <View className="rounded-2xl bg-blue-50 border border-blue-600/30 p-4 gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="warning-outline" size={18} color={Palette.blue[600]} />
        <Text className="text-base text-body font-bold">災害が起きたときのごみ</Text>
      </View>
      <Text className="text-sm text-body leading-relaxed">
        飯田市は災害廃棄物処理計画を策定しています。いざというときに慌てないよう、平常時から確認しておきましょう。
      </Text>
    </View>
  );
}

function Section({
  index,
  heading,
  body,
}: {
  index: number;
  heading: string;
  body: string[];
}) {
  return (
    <View className="gap-2">
      <Text className="text-lg text-body font-bold">
        {index}. {heading}
      </Text>
      {body.map((p, i) => (
        <Text key={i} className="text-base text-body leading-relaxed">
          {p}
        </Text>
      ))}
    </View>
  );
}

function Footer() {
  return (
    <View className="rounded-2xl bg-line px-4 py-3">
      <Text className="text-sm text-muted leading-relaxed">
        出典: 飯田市ごみ出しガイドブック。災害時は最新の市からの情報を必ずご確認ください。
      </Text>
    </View>
  );
}
