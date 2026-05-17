/**
 * 品目辞書（items.json）への部分一致検索（純粋関数）。
 *
 * 設計:
 * - ひらがな ↔ カタカナの差を正規化で吸収（IME 経由で打つときの揺れ対策）
 * - name 完全一致 > 前方一致 > 部分一致 > aliases の同順、でスコア化
 * - 95 品目 × 平均 6 aliases 程度を想定。React Compiler に任せて素直に書く
 */

import type { Item } from '@/types';

/**
 * 検索のためにユーザー入力 / 辞書文字列を正規化:
 * - 前後空白を除去
 * - 全種類の空白を除去
 * - ひらがな (U+3041–U+3096) をカタカナに揃える
 *
 * 漢字・カナ・記号はそのまま比較対象になる。
 */
export function normalizeJa(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, '')
    .replace(/[ぁ-ゖ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60),
    );
}

export type MatchField = 'name' | 'alias';

export interface ItemHit {
  item: Item;
  score: number;
  matchedField: MatchField;
}

/**
 * クエリで items を絞り込み、優先度順で返す。
 *
 * @param items 全品目（`data/common/items.json` の `items` 配列）
 * @param query ユーザー入力
 * @param max 最大件数（デフォルト 30）
 */
export function searchItems(items: Item[], query: string, max = 30): ItemHit[] {
  const q = normalizeJa(query);
  if (!q) return [];

  const hits: ItemHit[] = [];
  for (const item of items) {
    const best = scoreItem(item, q);
    if (best) hits.push(best);
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.item.name.localeCompare(b.item.name, 'ja'),
  );
  return hits.slice(0, max);
}

function scoreItem(item: Item, q: string): ItemHit | null {
  const name = normalizeJa(item.name);
  if (name === q) return { item, score: 1000, matchedField: 'name' };
  if (name.startsWith(q)) return { item, score: 800, matchedField: 'name' };
  if (name.includes(q)) return { item, score: 600, matchedField: 'name' };

  for (const alias of item.aliases) {
    const a = normalizeJa(alias);
    if (a === q) return { item, score: 500, matchedField: 'alias' };
    if (a.startsWith(q)) return { item, score: 400, matchedField: 'alias' };
    if (a.includes(q)) return { item, score: 300, matchedField: 'alias' };
  }

  return null;
}
