import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

/**
 * 画面共通の背景。上部の薄い青 (#EFF6FF) から下部の白 (#FFFFFF) への縦グラデーション。
 * 画面ルートで SafeAreaView の代わりに使う。カード・検索ボックス等の「面」は
 * bg-bg(白) のまま乗せる前提で、グラデは隙間・余白に出る。
 *
 * グラデは画面（ビューポート）に固定され、中身の ScrollView は上をスクロールする。
 */
const GRADIENT_COLORS = ['#EFF6FF', '#FFFFFF'] as const;

export default function ScreenBackground({
  children,
  edges = ['top'],
}: {
  children: ReactNode;
  edges?: readonly Edge[];
}) {
  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={edges}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
