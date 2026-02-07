---
title: "詳解：ReactとPreact Native (Signals) の技術的差異"
description: "React v19 と Preact Native (@preact/signalsを採用) の実装を徹底解剖。コード設計、ステート管理、イベントシステムの違いを技術的な視点から解説します。"
date: 2026-02-07
tags: ["React", "Preact", "Signals", "Architecture", "DeepDive"]
---

## 概要

本記事では、React v19 と Preact v10 + `@preact/signals` の具体的なコードを比較し、その設計思想と仕様の差異を深掘りします。単なる軽量化にとどまらない、Preact Native の設計上の利点を明らかにします。

## 1. 入出力の設計：Props 経由か、Signal 直接参照か

React では Props を通じてデータを下流に流すのが一般的ですが、Preact Native (Signals) ではコンポーネントが Signal を直接インポートして参照するスタイルが可能です。

### React: Props によるバケツリレー
React 版の `Header` は、親から `score` と `onReset` を受け取ります。

```tsx
// React: Header.tsx
export const Header: React.FC<Props> = ({ score, onReset }) => {
    return (
        <div>
            {/* scoreが更新されると、Header関数全体が再実行される */}
            <div>{score}</div>
            <button onClick={onReset}>New Game</button>
        </div>
    );
};
```

### Preact Native: Signal の直接参照
Native 版では、グローバル（またはストア）から定義された Signal を直接使用します。

```tsx
// Preact Native: Header.tsx
import { score, resetGame } from '../state/gameState';

export const Header = () => {
    return (
        <div>
            {/* score signalを直接 JSX に埋め込む */}
            {/* 更新時、この<div>の中身だけが書き換わり、Headerは再実行されない */}
            <div>{score}</div>
            <button onClick={resetGame}>New Game</button>
        </div>
    );
};
```

## 2. 【詳説】なぜ再レンダリングが抑制されるのか？

React と Preact Signals では、「値の変化」を DOM に反映させる経路が根本的に異なります。

4. 差分がある `score` のテキストノードだけが DOM に反映される。

> [!NOTE]
> **React のレンダリング仕様**
> React では「State の更新」が常に「コンポーネントの再レンダリング（再実行）」のトリガーとなります。この挙動の詳細は、[React: State: A Component's Memory](https://react.dev/learn/state-a-components-memory) や、描画プロセスを解説した [React: Render and Commit](https://react.dev/learn/render-and-commit) を参照してください。

### Preact Native: DOM へのダイレクトブロードキャスト
Preact の Signals は、仮想DOMの比較プロセスを「バイパス」する特別な仕組みを持っています。

**メカニズムの本質**:
Signal が JSX に埋め込まれると、Preact はコンポーネントを再実行する代わりに、**その場所にある DOM ノード（Text Node など）と Signal を直接紐付けます**。
値が更新されると、その特定の DOM ノードだけに対して直接的な更新（`node.data = newValue` 等）が走り、関数の再実行はおろか、仮想DOMの差分比較すら発生しません。

> [!TIP]
> **正確な仕様を確認する**
> この「コンポーネントをスキップして直接 DOM を更新する」挙動は、Preact Signals の公式ドキュメントで **"By default, Signals are fast, but they're even faster when used in place of Text or Props in JSX"** として紹介されています。
> 詳細は、[Preact Signals - Bypassing Virtual DOM](https://preactjs.com/guide/v10/signals#bypassing-virtual-dom) を参照してください。

## 3. ロジック実装の比較：Hooks vs Global Signals

実際のゲームロジックが記述されているコードを比較してみます。

### React: `useGrid` (Hooks)
`useCallback` の依存配列管理など、React 特有の配慮が必要です。

```typescript
// React: useGrid.ts
export const useGrid = () => {
    const [grid, setGrid] = useState<Grid>(initialGrid);

    const move = useCallback((direction: Direction) => {
        // ... (省略)
        setGrid(finalGrid);
    }, [grid]); // gridが変わるたびにmove関数が作り直される

    return { grid, move };
};
```

### Preact Native: `gameState.ts` (Signals)
ロジックと UI が完全に分離され、依存関係は Signals が自動的に解決します。

```typescript
// Preact Native: gameState.ts
export const grid = signal<Grid>(initialGrid);
export const score = signal(0);

export const move = (direction: Direction) => {
    // ... (省略)
    grid.value = finalGrid; // 値の代入だけで、依存している全パーツに通知される
};
```

## 4. イベントシステムの差異

React と Preact では、ブラウザのイベントを扱う仕組みが異なります。
詳細な仕様の違いについては、それぞれの公式ドキュメントを比較してみることをお勧めします。

- **React 向け**: [React: SyntheticEvent について](https://react.dev/reference/react-dom/components/common#react-event-object)
- **Preact 向け**: [Preact: Differences to React - Events](https://preactjs.com/guide/v10/differences-to-react#events)

## 5. まとめ

今回の検証を通じて、以下のことが明確になりました。

1.  **React**: 「コンポーネント」という単位で一貫性を保ち、巨大なエコシステムに守られながら開発できる。
2.  **Preact Native**: 「データの変化」という最小単位で DOM を制御し、Hooks のオーバーヘッドを避けつつ極限のパフォーマンスを引き出せる。

「ただの軽量化」を求めるなら移植版 (Port) で十分ですが、Preact 本来の設計思想を享受し、Hooks の依存地獄から解放されたいのであれば、Signals によるネイティブ実装は非常に魅力的な選択肢です。

---

本プロジェクトの実装コードは、[GitHub Monorepo](https://github.com/ariaria2021/tile-merge-game-preact) で全コードを公開しています。
実際に `packages/port` と `packages/native` を読み比べることで、設計の違いを実感してください。
