import { Alert, Linking, Text } from 'react-native';

/**
 * テキスト中の電話番号・URL を検出して、タップ可能なリンクとして描画する。
 *
 * 品目の指示文（さんあ〜る由来）には「環境課 0265-22-4511」や
 * 「https://www.city.iida.lg.jp/...」のような連絡先が平文で含まれる。
 * これらをタップで発信／ブラウザ起動できるようにし、ユーザーが番号を
 * 手控えしなくて済むようにする。
 *
 * - 電話番号: 市外局番付き（例 0265-22-4511）/ 0120・03 等 / 携帯
 * - URL: http(s):// で始まるもの
 * - それ以外の文字列は通常テキストのまま
 */

// 電話番号: 0 から始まり、ハイフン区切りの数字。全角は対象外（平文は半角想定）
const PHONE_RE = /0\d{1,4}-\d{1,4}-\d{3,4}/g;
const URL_RE = /https?:\/\/[^\s、。）)]+/g;

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'tel'; value: string }
  | { kind: 'url'; value: string };

/** テキストを通常 / 電話 / URL のセグメントに分割 */
export function tokenizeLinks(text: string): Segment[] {
  // 電話と URL の両方の出現位置を集める
  const matches: { start: number; end: number; kind: 'tel' | 'url'; value: string }[] = [];
  for (const m of text.matchAll(URL_RE)) {
    matches.push({ start: m.index, end: m.index + m[0].length, kind: 'url', value: m[0] });
  }
  for (const m of text.matchAll(PHONE_RE)) {
    matches.push({ start: m.index, end: m.index + m[0].length, kind: 'tel', value: m[0] });
  }
  matches.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of matches) {
    // URL の中に含まれる数字列を電話として二重検出した場合はスキップ
    if (m.start < cursor) continue;
    if (m.start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, m.start) });
    }
    segments.push({ kind: m.kind, value: m.value });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}

async function openTel(num: string) {
  const url = `tel:${num.replace(/[^0-9+]/g, '')}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('電話を発信できませんでした', num);
  }
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('リンクを開けませんでした', url);
  }
}

export default function LinkedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const segments = tokenizeLinks(text);
  return (
    <Text className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === 'tel') {
          return (
            <Text
              key={i}
              onPress={() => void openTel(seg.value)}
              accessibilityRole="link"
              accessibilityLabel={`${seg.value} に電話する`}
              className="text-brand-600 font-bold underline"
            >
              {seg.value}
            </Text>
          );
        }
        if (seg.kind === 'url') {
          return (
            <Text
              key={i}
              onPress={() => void openUrl(seg.value)}
              accessibilityRole="link"
              className="text-brand-600 underline"
            >
              リンクを開く
            </Text>
          );
        }
        return <Text key={i}>{seg.value}</Text>;
      })}
    </Text>
  );
}
