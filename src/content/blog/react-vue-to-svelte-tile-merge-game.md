---
title: "React & VueユーザーのためのSvelte 5入門 - 「コンパイラ型」は何が違うのか？同じゲームで徹底比較"
description: "React・Vueを学んできた開発者に向けて、Svelteの特徴（仮想DOMなし、コンパイル時リアクティビティ、Svelte 5のRunes）を同じ2048ゲームの実装をもとに分かりやすく解説します。"
date: 2026-02-15
tags: ["Svelte", "Svelte 5", "React", "Vue 3", "フレームワーク比較", "TypeScript", "入門"]
---

## はじめに

フロントエンドの主要なフレームワークとして広く使われている **React** や **Vue**。その一方で、「仮想DOMを使わない」「コンパイラがDOM操作コードを生成する」という独自のアプローチで注目を集めているのが **Svelte（スベルテ）** です。

さらに最新の **Svelte 5** では、新機能 **Runes（ルーンズ）** が導入され、リアクティビティの扱いやすさとTypeScriptとの親和性が大幅に強化されました。

本記事では、ReactやVueの経験を持つ開発者に向けて、「Svelteとはどのような設計思想のフレームワークなのか」「ReactやVueと何が違うのか」を、同一のゲーム（Tile Merge Game / 2048）の実装コードを比較しながら解説します。

---

## 1. Svelteの設計思想：ランタイム型 vs コンパイラ型

ReactやVueとSvelteの最大の違いは、**「実行時（ランタイム）に何をするか」** というアーキテクチャの根本にあります。

```
【React / Vue（仮想DOMアプローチ）】
ブラウザ実行時: 状態変更 → 仮想DOMツリーの再構築 → 差分検知（Diffing） → 実際のDOMを更新

【Svelte（コンパイラアプローチ）】
ビルド時: Svelteコンパイラが状態の依存関係を静的解析し、最小限のJavaScriptに変換
ブラウザ実行時: 状態変更 → 該当するDOMノードをダイレクトにピンポイント更新
```

### 主な特徴

1. **No Virtual DOM（仮想DOMを持たない）**
   - 実行時に仮想DOMの差分比較（Reconciliation）を行わないため、オーバーヘッドが少なく、メモリ効率に優れています。
2. **Truly Reactive（構文レベルのリアクティビティ）**
   - 特別なセッター関数や `.value` へのアクセスを多用せず、自然な代入操作で状態更新とUIの同期が行われます。
3. **Write Less Code（少ないコード量）**
   - ボイラープレート（定型文）が少なく、HTML/CSS/JSの標準に近い記述スタイルを維持できます。

---

## 2. 概念の対応表

React、Vue 3（Composition API）、Svelte 5（Runes）の主要な概念の比較です。

| 項目 | React 19 | Vue 3 (Composition API) | Svelte 5 (Runes) |
| :--- | :--- | :--- | :--- |
| **アーキテクチャ** | 仮想DOM / ランタイム型 | 仮想DOM + Proxyリアクティビティ | コンパイラ型（仮想DOMなし） |
| **基本状態 (State)** | `const [count, setCount] = useState(0)` | `const count = ref(0)` | `let count = $state(0)` |
| **算出プロパティ (Derived)** | `useMemo(() => count * 2, [count])` | `const double = computed(() => count.value * 2)` | `const double = $derived(count * 2)` |
| **副作用 (Effect)** | `useEffect(() => { ... }, [deps])` | `watchEffect(() => { ... })` | `$effect(() => { ... })` |
| **Props受け取り** | `({ score }: Props)` | `defineProps<{ score: number }>()` | `let { score } = $props()` |
| **リストレンダリング** | `{items.map(item => <Tile key={item.id} />)}` | `<Tile v-for="item in items" :key="item.id" />` | `{#each items as item (item.id)}<Tile />{/each}` |
| **スタイルスコープ** | CSS Modules / styled-components | `<style scoped>` / CSS Modules | `<style>`（標準でスコープ化） |

---

## 3. 実装比較：Tile Merge Game（2048）

同一ロジック・同一UIのゲーム実装を通して、コンポーネントの構造の違いを確認します。

### ① コンポーネント定義とPropsの受け取り

ヘッダーコンポーネント（スコア表示とリセットボタン）の比較です。

#### React (`Header.tsx`)
```tsx
interface HeaderProps {
  score: number;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ score, onReset }) => {
  return (
    <header className={styles.header}>
      <h1>2048</h1>
      <div className={styles.score}>{score}</div>
      <button onClick={onReset}>New Game</button>
    </header>
  );
};
```

#### Vue 3 (`Header.vue`)
```vue
<script setup lang="ts">
defineProps<{
  score: number;
}>();

const emit = defineEmits<{
  (e: 'reset'): void;
}>();
</script>

<template>
  <header class="header">
    <h1>2048</h1>
    <div class="score">{{ score }}</div>
    <button @click="emit('reset')">New Game</button>
  </header>
</template>
```

#### Svelte 5 (`Header.svelte`)
```svelte
<script lang="ts">
  // $props() Rune で分割代入
  let { score, onreset }: { score: number; onreset: () => void } = $props()
</script>

<header class="header">
  <h1>2048</h1>
  <div class="score">{score}</div>
  <!-- 標準のHTMLイベント属性 onclick を使用 -->
  <button onclick={onreset}>New Game</button>
</header>
```

Svelte 5 では `$props()` Rune により、TypeScriptの型定義を直接指定しながらシンプルな変数としてPropsを受け取れます。Vueの `defineEmits` や Reactのカスタムハンドラ命名規則のような制約が少なく、Web標準のHTML属性に近い構文となっています。

---

### ② リストレンダリングと算出データ

盤面のセルを展開し、タイルを描画する処理です。

#### Svelte 5 (`Board.svelte`)
```svelte
<script lang="ts">
  import type { Grid } from '@game-frameworks/shared/types'
  import Tile from './Tile.svelte'
  import boardStyles from '../styles/Board.module.css'

  let { grid }: { grid: Grid } = $props()

  // $derived: 依存する値を自動追跡して再計算（ReactのuseMemo、Vueのcomputedに相当）
  const tiles = $derived(grid.flat().filter((cell) => cell !== null))
</script>

<div class={boardStyles.boardContainer}>
  <!-- 背景グリッド（16マス） -->
  <div class={boardStyles.gridContainer}>
    {#each Array(16) as _, i (i)}
      <div class={boardStyles.gridCell}></div>
    {/each}
  </div>

  <!-- タイルレイヤー（キー付きループ） -->
  <div class={boardStyles.tileContainer}>
    {#each tiles as cell (cell.id)}
      <Tile {cell} />
    {/each}
  </div>
</div>
```

- `$derived(...)` は依存している変数（ここでは `grid`）の変更を自動で検知して値を再計算します。Reactのように明示的な依存配列（`deps`）を指定する必要はありません。
- テンプレート構文には `{#each ...}` ブロックを用い、末尾に `(key)` を渡すことでキー指定が可能です。

---

### ③ 状態管理（Svelte Store と Svelte 5 Runes）

Svelte は外部ライブラリを追加することなく、組み込みの **Store** 機能でグローバル状態やカスタム状態を管理できます。

```typescript
// stores/gameStore.ts
import { writable, derived } from 'svelte/store'
import type { Grid } from '@game-frameworks/shared/types'

// 変更可能なストア
export const scoreStore = writable(0)

// 他のストアから導出されるストア
export const gameOverStore = derived(gridStore, ($grid) => isGameOver($grid))

export const addScore = (added: number) => {
  scoreStore.update((s) => s + added)
}
```

コンポーネント内では `$storeName` のように先頭に `$` を付けることで自動的にサブスクライブ（購読）と破棄が行われます。

---

## 4. React・Vueユーザーから見たSvelteの評価

### メリット
- **直感的な構文と低い学習コスト**: HTML/CSS/JS の基礎知識があればすぐに書き始められる。
- **小さなバンドルサイズ**: 仮想DOMランタイムが含まれないため、初期読み込みパフォーマンスが高い。
- **スコープ付きCSSの標準サポート**: `<style>` を記述するだけでコンポーネント単位のスコープが自動適用される。
- **Svelte 5 での型安全性向上**: Runes の導入により、TypeScript との統合が大幅に改善。

### 留意点
- **エコシステムの規模**: React や Vue に比べると、UIコンポーネントライブラリやサードパーティパッケージの選択肢はまだ限られている。
- **コンパイル前提の環境**: ビルドツール（Vite 等）を介した事前コンパイルが必須。

---

## 5. まとめ

Svelte は、仮想DOMのオーバーヘッドを排し、コンパイラによって必要最小限のDOM操作コードを生成するという明確な設計思想を持っています。

React のような柔軟なコンポーネント設計や Vue のような直感的なテンプレート記法のメリットを取り入れつつ、ボイラープレートを削ぎ落とした開発体験が特徴です。

各フレームワークの実装比較コードは、[tile-merge-game-frameworks リポジトリ](https://github.com/ariaria2021/tile-merge-game-frameworks) で公開しています。実際にコードを動かしながら比較してみてください。

