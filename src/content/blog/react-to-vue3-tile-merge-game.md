---
title: "ReacユーザーのためのVue 3入門 - 同じゲームでフレームワークを比較"
description: "React開発者向けに、Vue 3の基本を学ぶガイド。同じTile Mergeゲームの実装を例に、状態管理、ライフサイクル、コンポーネント設計の違いを解説します。"
date: 2026-02-14
tags: ["Vue 3", "React", "フレームワーク比較", "TypeScript", "開発ガイド"]
---

こんにちは！このブログでは、React開発者向けに **Vue 3** の基本を学ぶための実践的なガイドをお届けします。

同じゲーム（Tile Merge Game）をReactとVue 3で実装し、その違いを直接比較することで、フレームワークの選択肢を広げられるようにしました。

## 📚 このガイドの構成

このガイドは以下のような構成になっています：

1. **プロジェクト構成**：Monorepoでの複数フレームワーク管理
2. **状態管理**：`useState` vs `ref()` / `reactive()`
3. **ライフサイクル**：`useEffect` vs Vue3の各種hook
4. **コンポーネント設計**：Props、Events、`<script setup>`
5. **イベント処理**：キーボード・タッチ入力
6. **スタイリング**：CSS Modules と `<style scoped>`
7. **実装パターン比較**：具体的なコード例

## 🎮 サンプルプロジェクト

このガイドで使うサンプルプロジェクト：

**📦 [tile-merge-game-frameworks](https://github.com/ariaria2021/tile-merge-game-frameworks)**

- React版：https://ariaria2021.github.io/tile-merge-game-frameworks/react/
- Vue3版：https://ariaria2021.github.io/tile-merge-game-frameworks/vue3/

両バージョンは見た目・操作感が同じですが、内部実装は大きく異なります。このプロジェクトを参考に、ReactのパターンをどのようにVue 3に置き換えるかを学べます。

---

## 1️⃣ プロジェクト構成の違い

### React版の構造例

```typescript
// packages/react/src/hooks/useGrid.ts
export const useGrid = () => {
  const [grid, setGrid] = useState<Grid>(() => {
    let initialGrid = createEmptyGrid();
    initialGrid = addRandomTile(initialGrid);
    return initialGrid;
  });

  const move = useCallback((direction: Direction) => {
    // ゲーム処理
    setGrid(finalGrid);
    return { moved, score };
  }, [grid]);

  return { grid, move, resetGrid };
};
```

### Vue 3版の構造

```typescript
// packages/vue3/src/composables/useGame.ts
export const useGame = () => {
  const grid = ref<Grid>(() => {
    let initialGrid = createEmptyGrid();
    initialGrid = addRandomTile(initialGrid);
    return initialGrid;
  }());

  const move = (direction: Direction) => {
    // ゲーム処理
    grid.value = finalGrid;
    return { moved, score };
  };

  return { grid, move, resetGrid };
};
```

**重要な違い**：

| 項目 | React | Vue 3 |
|---|---|---|
| Hook命名 | `useGrid` | `useGame` |
| 状態更新 | `setGrid()` | `grid.value = ...` |
| 関数キャッシュ | `useCallback` | 不要 |
| 依存配列 | `[grid]` | リアクティブ |

---

## 2️⃣ 状態管理：useState vs ref()

### React：useState

状態を管理するには `useState` を使用：

```tsx
function App() {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const updateScore = (addedScore: number) => {
    setScore(s => s + addedScore);
    if (score + addedScore > bestScore) {
      setBestScore(score + addedScore);
    }
  };

  return <Header score={score} />;
}
```

**特徴**：
- 状態更新は**新しい値を返す関数**である必要がある
- 前の状態にアクセスするには `s => ...` で参照する
- クロージャ内では古い `score` 値を参照する可能性がある

### Vue 3：ref() と reactive()

Vue 3では `ref()` または `reactive()` で反応性を管理：

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

const score = ref(0)
const bestScore = ref(0)
const finished = ref(false)

// または
const state = reactive({
  score: 0,
  bestScore: 0,
  finished: false
})

const updateScore = (addedScore: number) => {
  score.value += addedScore  // 直感的！
  if (score.value > bestScore.value) {
    bestScore.value = score.value
  }
}
</script>
```

**特徴**：
- **直感的な更新**：`score.value += addedScore` でOK
- `reactive()` ではプロキシにより自動追跡
- テンプレート内では `.value` 不要（自動unrap）

**比較表**：

```
React:  setScore(prev => prev + addedScore)
Vue 3:  score.value += addedScore

👉 Vue 3の方がシンプル！
```

---

## 3️⃣ ライフサイクル：useEffect vs watch/onMounted

### React：useEffect

ReactはライフサイクルをuseEffectで管理：

```tsx
function App() {
  const { grid, move } = useGrid();
  const [finished, setFinished] = useState(false);

  // グリッド変更を監視
  useEffect(() => {
    if (isGameOver(grid)) {
      setFinished(true);
    }
  }, [grid]);  // 依存配列が重要

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finished) return;
      const result = move(getDirection(e.key));
      updateScore(result.score);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, finished]); // 依存配列が複雑に...

  return <Board grid={grid} />;
}
```

**課題**：
- 依存配列の管理が複雑
- `move`, `finished` が変わるたびに再登録される
- 閉じ込められた古い値の参照バグが発生しやすい

### Vue 3：watch, watchEffect, onMounted

Vue 3はより明確なライフサイクルAPI：

```vue
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const { grid, move } = useGame()
const finished = ref(false)

// グリッド変更を監視
watch(
  () => grid.value,
  () => {
    finished.value = isGameOver(grid.value)
  }
)

// キーボード操作（シンプル）
const handleKeyDown = (e: KeyboardEvent) => {
  if (finished.value) return
  const result = move(getDirection(e.key))
  updateScore(result.score)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
```

**利点**：
- 登録・解除が明確に分離
- 関数の再登録がない（クロージャ内で最新の状態を参照可能）
- 依存追跡が暗黙的（自動で最新値を使う）

**ライフサイクルフックの対応**：

| React | Vue 3 |
|---|---|
| `useEffect(() => {}, [])` | `onMounted()` |
| `useEffect(() => { return cleanup })` | `onBeforeUnmount()` |
| `useEffect(() => {}, [state])` | `watch(() => state)` |
| 複数のeffect | 複数のwatch/onMounted |

---

## 4️⃣ コンポーネント設計：Props と emit

### React：Props と callback

```tsx
// Header.tsx
type Props = {
  score: number;
  onReset: () => void;
};

export const Header: React.FC<Props> = ({ score, onReset }) => {
  return (
    <div>
      <span>{score}</span>
      <button onClick={onReset}>New Game</button>
    </div>
  );
};

// App.tsx
<Header score={score} onReset={handleReset} />
```

### Vue 3：Props と emits

```vue
<!-- Header.vue -->
<template>
  <div>
    <span>{{ score }}</span>
    <button @click="$emit('reset')">New Game</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  score: number
}

defineProps<Props>()
defineEmits<{
  reset: []
}>()
</script>

<!-- App.vue -->
<Header :score="score" @reset="handleReset" />
```

**違い**：

| 項目 | React | Vue 3 |
|---|---|---|
| Props渡し | `<Header score={5} />` | `<Header :score="5" />` |
| 子→親通信 | callback: `onReset()` | emit: `@reset` |
| 型定義 | interface Props + FC<Props> | defineProps<Props>() |
| イベント発火 | `onClick={onReset}` | `@click="$emit('reset')"` |

---

## 5️⃣ テンプレート内での差分：v-for と条件分岐

### React：map と三項演算子

```tsx
// Board.tsx
const tiles = grid.flat().filter(cell => cell !== null);

return (
  <div className={styles.boardContainer}>
    <div className={styles.gridContainer}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className={styles.gridCell} />
      ))}
    </div>
    <div className={styles.tileContainer}>
      {tiles.map((cell) => (
        <Tile key={cell.id} cell={cell} />
      ))}
    </div>
  </div>
);

// GameOverlay.tsx → 条件分岐
export const GameOverlay: React.FC<Props> = ({ isGameOver, onRetry }) => {
  if (!isGameOver) return null;  // 早期return

  return (
    <div>
      <h2>Game Over!</h2>
      <button onClick={onRetry}>Try Again</button>
    </div>
  );
};
```

### Vue 3：v-for と v-if

```vue
<!-- Board.vue -->
<template>
  <div :class="boardStyles.boardContainer">
    <div :class="boardStyles.gridContainer">
      <div v-for="i in 16" :key="i" :class="boardStyles.gridCell" />
    </div>
    <div :class="boardStyles.tileContainer">
      <Tile v-for="cell in tiles" :key="cell.id" :cell="cell" />
    </div>
  </div>
</template>

<script setup lang="ts">
const tiles = computed(() => {
  return grid.value.flat().filter(cell => cell !== null)
})
</script>

<!-- GameOverlay.vue → v-if使用 -->
<template>
  <div v-if="isGameOver">  <!-- v-if で条件分岐 -->
    <h2>Game Over!</h2>
    <button @click="$emit('retry')">Try Again</button>
  </div>
</template>
```

**テンプレート構文の比較**：

| 機能 | React | Vue 3 |
|---|---|---|
| ループ | `array.map()` | `v-for` |
| 条件分岐 | `condition ? ... : ...` | `v-if` |
| クラス | `className={...}` | `:class="{...}"` |
| スタイル | `style={{...}}` | `:style="{...}"` |
| イベント | `onClick={fn}` | `@click="fn"` |

---

## 6️⃣ CSS Modules と scoped styles

### React：CSS Modules

```tsx
// Tile.tsx
import styles from '../styles/Tile.module.css';

const classes = [
  styles.tile,
  styles[`tile${value}`],  // 動的クラス名
  isNew ? styles.newTile : '',
].join(' ');

return <div className={classes}>{value}</div>;
```

```css
/* Tile.module.css */
.tile {
  position: absolute;
  background-color: #f3f4f6;
  transition: top 150ms ease-in-out;
}

.tile2 { background-color: #ffffff; }
.tile4 { background-color: #f3f4f6; }
/* ... */

.newTile {
  animation: appear 200ms ease;
}

@keyframes appear {
  0% { opacity: 0; transform: scale(0); }
  100% { opacity: 1; transform: scale(1); }
}
```

### Vue 3：Scoped Styles （同時にCSS Modules も使用可）

```vue
<!-- Tile.vue -->
<template>
  <div :class="[tileStyles.tile, tileStyles[`tile${cell.value}`]]">
    {{ cell.value }}
  </div>
</template>

<script setup lang="ts">
import tileStyles from '../styles/Tile.module.css'
</script>

<style scoped>
/* または -->
.tile {
  position: absolute;
  background-color: #f3f4f6;
  transition: top 150ms ease-in-out;
}

.tile2 { background-color: #ffffff; }
/* ... */

@keyframes appear {
  0% { opacity: 0; transform: scale(0); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
```

**スタイルスコープの比較**：

| 項目 | React + CSS Modules | Vue 3 + <style scoped> |
|---|---|---|
| スコープ隔離 | ✅ hash で自動隔離 | ✅ scoped attribute で自動隔離 |
| 開発時DX | クラス名の型チェック | スタイル即座に反映 |
| バンドルサイズ | CSS Modules | <style scoped> |
| 推奨パターン | CSS Modules | scoped（推奨） |

---

## 7️⃣ イベント処理：キーボード・タッチ

### React：useEffect で登録・解除

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (finished) return;

    let result = { moved: false, score: 0 };

    switch (e.key) {
      case 'ArrowUp':
        result = move('UP');
        e.preventDefault();
        break;
      // ... 他のキー
    }

    if (result.moved) {
      updateScore(result.score);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [move, finished, bestScore]); // 依存配列が複雑...

// タッチ操作（コンポーネントのprops）
const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
};

return (
  <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
    ...
  </div>
);
```

### Vue 3：onMounted/onBeforeUnmount で登録・解除

```vue
<template>
  <div @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    ...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const touchStart = ref<{ x: number; y: number } | null>(null)

const handleKeyDown = (e: KeyboardEvent) => {
  if (finished.value) return

  let result = { moved: false, score: 0 }

  switch (e.key) {
    case 'ArrowUp':
      result = move('UP')
      e.preventDefault()
      break
    // ... 他のキー
  }

  if (result.moved) {
    updateScore(result.score)
  }
}

const handleTouchStart = (e: TouchEvent) => {
  touchStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
```

**イベント処理の比較**：

| 項目 | React | Vue 3 |
|---|---|---|
| イベントリスナ登録 | `addEventListener` + useEffect | onMounted |
| リスナ解除 | useEffect cleanup | onBeforeUnmount |
| テンプレートイベント | `onClick={fn}` | `@click="fn"` |
| 依存管理 | 手動（依存配列） | 自動（リアクティブ） |

---

## 🎯 学習ポイント：React vs Vue 3

### 1. 状態管理の哲学の違い

**React**：
- 状態は「イミュータブル」パラダイムで管理
- `setState` で新しい状態を返す
- 関数型プログラミングの影響が強い

**Vue 3**：
- 状態は「ダイレクトに変更」できる
- `ref.value = ...` で直感的に更新
- リアクティブシステムが背後で追跡

### 2. ライフサイクルの管理方法

**React**：
- `useEffect` が全てを担当
- 依存配列で「何が変わったか」を明示
- 複数のeffectが並行実行される

**Vue 3**：
- 専用の hook が分かれている
- マウント、アンマウント、変化を個別に管理
- より意図が明確

### 3. テンプレート vs JSX

**React**：
- JSX：完全にJavaScriptの力を使える
- ロジックが複雑になりやすい

**Vue 3**：
- Template：HTML風で宣言的
- ロジックと表現が分離
- 学習コスト低い

---

## 🚀 次のステップ

1. **[tile-merge-game-frameworks](https://github.com/ariaria2021/tile-merge-game-frameworks)** をクローンして両バージョンのコードを読む
2. React版をローカルで実行：`npm run dev:react`
3. Vue3版をローカルで実行：`npm run dev:vue3`
4. 同じ機能が異なるコードでどう実装されているか比較

---

## 📖 参考資料

- [Vue 3 公式ドキュメント](https://vuejs.org/)
- [Composition API ガイド](https://vuejs.org/guide/extras/composition-api-faq.html)
- [React ドキュメント](https://react.dev/)
- [tile-merge-game-frameworks リポジトリ](https://github.com/ariaria2021/tile-merge-game-frameworks)

---

**最後に**：ReactとVue 3は両方とも強力なフレームワークです。このガイドがあなたのフレームワーク選択の手助けになれば幸いです！ 🎉

どのフレームワークを選ぶにせよ、**原理を理解する**ことが重要です。このガイドが少しでもお役に立てば嬉しいです。

Happy coding! 💻
