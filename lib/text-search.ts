/**
 * 品目辞書（items.json）への部分一致検索（純粋関数）。
 *
 * 設計:
 * - ひらがな ↔ カタカナの差を正規化で吸収（IME 経由で打つときの揺れ対策）
 * - name 完全一致 > 前方一致 > 部分一致 > aliases の同順でスコア化
 * - 最下位として「逆方向マッチ」: クエリが辞書名/別名で“終わる”場合も拾う（末尾＝複合名詞の中心語）
 *   （カメラ判定で AI が「デジタル時計」のような具体名を返したとき「時計」に紐づけるため。
 *    部分一致は語の途中に当たって誤爆するため使わない）
 * - 589 品目 × aliases。React Compiler に任せて素直に書く
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

  // 逆方向マッチ: クエリ(q)の方が辞書名より具体的なケースを拾う。
  // 主にカメラ判定で AI が「デジタル時計」のように修飾語付きの名前を返したとき、
  // 一般名の辞書項目（「時計」）に紐づける。日本語の複合名詞は「修飾語＋中心語」なので、
  // 中心語＝末尾の一致(endsWith)だけを見る。部分一致(includes)は語の途中に当たって
  // 誤爆するため不採用（例: 「折りたたみ傘」の "たたみ" が「畳」に一致してしまう）。
  // 既存マッチより低スコアにし、他にヒットが無いときだけ効かせる。誤爆抑制で 2 文字以上に限定。
  if (name.length >= 2 && q.endsWith(name)) return { item, score: 280, matchedField: 'name' };

  for (const alias of item.aliases) {
    const a = normalizeJa(alias);
    if (a.length >= 2 && q.endsWith(a)) return { item, score: 230, matchedField: 'alias' };
  }

  return null;
}
