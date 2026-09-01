---
title: "UIの表示条件を単体テスト可能にする：React・Vue・Svelteで共通する設計"
description: "複雑になりがちなUIの表示条件を、テンプレートから純粋関数へ切り出し、Vitestで検証する設計をReact・Vue・Svelteの例で整理します。"
date: 2026-09-01
tags: ["TypeScript", "Vitest", "React", "Vue 3", "Svelte", "テスト"]
draft: true
---

## はじめに

タブや権限、入力状態などが絡むと、UIを表示する条件はすぐに複雑になります。

```tsx
{currentTab === 'collection' && hasUnlockedItems && !isLoading && <CollectionBook />}
```

この程度ならJSXやテンプレートに直接書いて問題ありません。しかし、条件が複数箇所で必要になったり、例外が増えたりすると、「どの状態で表示されるべきか」を確認しづらくなります。

この記事では、表示条件をフレームワークのテンプレートから切り離し、普通のTypeScriptとして単体テストする方法を整理します。

## 表示条件を純粋関数にする

まず、表示可否を判定する関数をコンポーネントの外へ出します。

```ts
// tabRules.ts
export type Tab = 'game' | 'collection' | 'story'

export const canShowCollection = (
  currentTab: Tab,
  hasUnlockedItems: boolean,
  isLoading: boolean,
) => currentTab === 'collection' && hasUnlockedItems && !isLoading
```

この関数は引数以外の状態を読まず、画面を直接操作もしません。入力が同じなら常に同じ結果を返す、いわゆる純粋関数です。

そのため、ブラウザやコンポーネントを起動しなくてもテストできます。

## Vitestで状態の組み合わせを検証する

表示条件は真偽表の形でテストすると、仕様が読みやすくなります。

```ts
// tabRules.test.ts
import { describe, expect, it } from 'vitest'
import { canShowCollection } from './tabRules'

describe('canShowCollection', () => {
  it.each([
    ['collection', true, false, true],
    ['collection', false, false, false],
    ['collection', true, true, false],
    ['game', true, false, false],
    ['story', true, false, false],
  ] as const)('%s / unlocked=%s / loading=%s → %s', (tab, unlocked, loading, expected) => {
    expect(canShowCollection(tab, unlocked, loading)).toBe(expected)
  })
})
```

このテストは「図鑑タブで、何かを解放済みで、かつ読み込み中ではないときだけ表示する」という仕様そのものです。条件を変更したときも、意図せず別の状態を壊していないか確認できます。

## 各フレームワークでは関数を呼ぶだけ

判定を切り出した後のコンポーネント側は、React・Vue・Svelteで大きく変わりません。

### React

```tsx
{canShowCollection(currentTab, hasUnlockedItems, isLoading) && (
  <CollectionBook />
)}
```

### Vue 3

```vue
<CollectionBook
  v-if="canShowCollection(currentTab, hasUnlockedItems, isLoading)"
/>
```

### Svelte

```svelte
{#if canShowCollection(currentTab, hasUnlockedItems, isLoading)}
  <CollectionBook />
{/if}
```

構文は異なりますが、判定本体がフレームワークに依存しないTypeScriptになっているため、同じ方針でテストできます。

## 単体テストとコンポーネントテストの役割

純粋関数の単体テストだけで、画面のすべてを保証できるわけではありません。

- **単体テスト**: 表示条件の仕様が正しいかを高速に確認する
- **コンポーネントテスト**: 条件に応じて実際にコンポーネントが表示・非表示になるかを確認する
- **E2Eテスト**: ユーザー操作から画面遷移までを確認する

条件が複雑なほど、まず純粋関数として仕様を固定し、その上で重要な画面だけをコンポーネントテストする構成が扱いやすくなります。

## まとめ

単純な表示条件はテンプレートやJSXに直接書いて構いません。一方で、条件が長い、複数箇所で使う、仕様としてテストしたい場合は、判定を純粋関数へ切り出すのが有効です。

React、Vue、Svelteのどれを使っていても、表示ロジックを普通のTypeScriptとして扱えば、フレームワーク固有の書き方に引きずられずにテストできます。
