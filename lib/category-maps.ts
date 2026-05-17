/**
 * カテゴリ ID → 表示名・カラーコードのマップを構築する純粋関数。
 *
 * 用途:
 * - 結果画面 / 検索画面 / 収集日画面で、`categoryId` から表示名・カラーを引くため
 * - 各画面で同じヘルパーを定義していたのを DRY 化
 *
 * 設計:
 * - 1 回の loop で nameMap / colorMap の両方を構築（js-combine-iterations）
 * - 戻り値は CategoryId（13 値）すべてを想定するが、定義に無いキーは undefined。
 *   呼び出し側で `map[id] ?? fallback` のパターンで使う（既存コードと同じ流儀）
 * - React Compiler により `data` 参照が同じ間は memoize される
 */

import type { CategoriesData, CategoryId } from '@/types';

export interface CategoryMaps {
  /** CategoryId → 表示名（categories.json の name） */
  nameMap: Record<CategoryId, string>;
  /** CategoryId → カラーコード（categories.json の color） */
  colorMap: Record<CategoryId, string>;
}

/**
 * categories.json から 1 回の loop で nameMap と colorMap を同時に構築。
 *
 * @example
 * const { nameMap, colorMap } = buildCategoryMaps(data.categories);
 * const label = nameMap[item.categoryId] ?? item.categoryId;
 * const color = colorMap[item.categoryId] ?? '#6B7280';
 */
export function buildCategoryMaps(data: CategoriesData): CategoryMaps {
  const nameMap = {} as Record<CategoryId, string>;
  const colorMap = {} as Record<CategoryId, string>;
  for (const c of data.categories) {
    nameMap[c.id] = c.name;
    colorMap[c.id] = c.color;
  }
  return { nameMap, colorMap };
}
