---
title: "Tile Merge Game - Framework Comparison"
description: "同じゲームをReactとVue3で実装し比較するmonorepo。フレームワークの違いを学ぶための教育的なサンプルプロジェクト。"
date: 2026-02-14
tags: ["React", "Vue 3", "TypeScript", "Framework Comparison", "Educational"]
github: "https://github.com/ariaria2021/tile-merge-game-frameworks"
demo: "https://ariaria2021.github.io/tile-merge-game-frameworks/"
featured: true
---

## 概要

**Tile Merge Game - Framework Comparison** は、同じパズルゲームをReactとVue 3で実装し、フレームワークの違いを直接比較できる教育的なmonorepoプロジェクトです。

Reactユーザー向けにVue 3の基本を学べるように設計されており、実装パターンの違いを通じて、フレームワーク選択の判断材料を提供します。

## 特徴

### 🎮 同じゲーム、複数のフレームワーク
- **React版**：Hooks（useState, useCallback, useEffect）を活用した実装
- **Vue 3版**：Composition API（ref, watch, onMounted）を活用した実装
- 両バージョンは見た目・操作感が完全に同一

### 🏗️ 共有ロジック層
- ゲームロジック（グリッド操作、スコア計算）はTypeScriptで統一
- フレームワーク非依存の`packages/shared/`に集約
- `gridUtils.ts`：グリッド生成・タイル追加
- `moveUtils.ts`：タイル移動・マージ処理

### 📚 React vs Vue 3 学習ガイド
- **状態管理**：`useState` vs `ref()` / `reactive()`
- **ライフサイクル**：`useEffect` vs `watch` / `onMounted`
- **コンポーネント設計**：Props / emit の実装パターン
- **テンプレート**：JSX vs Template Syntax
- 詳細な[ブログ記事](https://ariaria2021.github.io/blog/react-to-vue3-tile-merge-game/)で解説

## 技術スタック

### Monorepo 構成
```
packages/
├── shared/       # ゲームロジック（TypeScript）
├── react/        # React 19 + TypeScript + Vite
└── vue3/         # Vue 3 + TypeScript + Vite
```

### 共通技術
- **TypeScript 5.9**：型安全性確保
- **Vite 7**：高速開発・ビルド
- **Node.js >= 24.0**：最新JavaScript機能対応
- **pnpm Workspaces**：効率的な依存管理

## ゲーム仕様

- **操作**：矢印キー（PC）/ スワイプ（モバイル）
- **ルール**：同じ数字のタイルをマージして2048を目指す
- **スコア**：マージされたタイルの値が加算
- **レスポンシブ**：PC・タブレット・スマートフォン対応

## アーキテクチャの工夫

### フレームワーク非依存設計
```typescript
// packages/shared/utils
export const gridUtils = {
  createEmptyGrid(),
  addRandomTile(),
  isGameOver()
}
```

### コンポーネント設計パターン
- **Board**：グリッド表示（CSS Grid + 絶対配置）
- **Tile**：個別タイル（動的位置・色・アニメーション）
- **Header**：スコア表示・リセット
- **GameOverlay**：ゲームオーバー画面

### スタイル戦略
- CSS Modules で両フレームワーク統一
- CSS変数（`--gap`）でレスポンシブ対応
- Tailwindなども不要なシンプル構成

## デプロイ・CI/CD

- **GitHub Actions**：自動ビルド・デプロイ
- **GitHub Pages**：React版・Vue3版を自動分離ホスト
- Node v24自動セットアップ
- `main`ブランチへのpush時に自動実行

## 学習価値

このプロジェクトを通じて以下が学べます：

1. **フレームワークの本質**：同じロジック、異なる実装により、各フレームワークの特徴が浮き彫りに
2. **Monorepo管理**：`pnpm workspaces`による複数プロジェクト統一管理
3. **CI/CD実装**：GitHub Actions による自動デプロイの実装
4. **TypeScript活用**：型安全な汎用ロジック層の設計
5. **パフォーマンス**：Viteの高速開発エクスペリエンス

## クイックスタート

```bash
git clone https://github.com/ariaria2021/tile-merge-game-frameworks.git
cd tile-merge-game-frameworks
pnpm install

# React版開発
pnpm run dev:react

# Vue3版開発
pnpm run dev:vue3
```

## 関連資料

- 📖 [React → Vue 3 学習ガイド](https://ariaria2021.github.io/blog/react-to-vue3-tile-merge-game/)
- 🎮 [React版デモ](https://ariaria2021.github.io/tile-merge-game-frameworks/react/)
- 🎮 [Vue3版デモ](https://ariaria2021.github.io/tile-merge-game-frameworks/vue3/)
- 💻 [GitHubリポジトリ](https://github.com/ariaria2021/tile-merge-game-frameworks)
