---
title: "ReactからPreactへの移行ガイド：軽量化の驚くべき効果と実装のコツ"
description: "既存のReactアプリをPreactへ移行。驚くほど簡単な手順と、サイズ・パフォーマンスの劇的な変化を実測データとともに解説。Signalsによる最適化の深掘りも。"
date: 2026-02-07
tags: ["React", "Preact", "Signals", "Performance", "TypeScript"]
---

## はじめに

「Reactで作ったアプリが少し重い」「もっと軽量な選択肢はないか？」
そんな時に真っ先に候補に挙がるのが **Preact** です。

今回は、自作の「[Tile Merge Game](https://ariaria2021.github.io/tile-merge-game/)」を題材に、ReactからPreactへの移行手順と、その効果を徹底検証しました。

## 1. 移行の驚くべき簡単さ

「ライブラリを変えるのは大変そう」という先入観があるかもしれませんが、Preactへの移行（移植）は驚くほどスムーズです。

### やったことは「インポートの書き換え」だけ
今回の移植で、ロジックの変更は **0行** でした。

具体的には、以下のように `react` を `preact/hooks` に書き換えるだけです。

```diff
- import { useState, useEffect } from 'react';
+ import { useState, useEffect } from 'preact/hooks';
```

`memo` などを使っている場合は、`preact/compat` を通じてそのまま利用できます。

```diff
- import { memo } from 'react';
+ import { memo } from 'preact/compat';
```

この「ほぼ検索置換だけで済む」という圧倒的な親和性が、移行のハードルを極限まで下げてくれます。

## 2. React vs Preact 実測比較

実際にプロダクションビルドを行い、JSバンドルサイズを比較しました。

| 実装バージョン | JS (未圧縮) | JS (Gzip) | 削減率 |
| :--- | :---: | :---: | :---: |
| **React (v19)** | 199.76 kB | 63.23 kB | - |
| **Preact Port** | **26.20 kB** | **10.49 kB** | **約84% 削減** |

**JSサイズが 1/7 以下に。**
小規模なツールやゲームにおいて、React本体がいかに「重い」のか、そしてPreactがいかに「効率的」なのかが数字に表れています。

### 書き心地や性能の違い
- **ビルド速度**: Preactの方が圧倒的に速い（Vite で 1.1s -> 0.3s）。
- **イベント**: Preactはブラウザ標準のイベントに近い挙動をします。Reactの `SyntheticEvent` に依存していない限り、問題になることはありません。

## 3. 【おまけ】Signalsによるネイティブ最適化（深掘り）

せっかくPreactを使うなら、さらに踏み込んだ最適化も試したいところです。
Preact独自の強力なステート管理、**Signals (`@preact/signals`)** を導入した「ネイティブ版」も作成しました。

### 3世代比較データ

| バージョン | JS (Gzip) | 特徴 |
| :--- | :---: | :--- |
| **React** | 63.23 kB | 標準・多機能。 |
| **Preact Port** | 10.49 kB | ReactのHooksをそのまま使った移植版。 |
| **Preact Native**| 10.69 kB | **Signals** による細粒度な更新。 |

### Signals版のメリットは「サイズ以上の価値」がある
Signalsを採用すると、サイズはそれほど変わりませんが、コンポーネントの再レンダリング回数を劇的に減らすことができます。さらに、Hooksの依存配列 (`useEffect` の第2引数など) に悩まされることがなくなり、コードがより宣言的でバグの入りにくいものになります。

> [!NOTE]
> **技術的な仕組みを詳しく知りたい方へ**
> なぜ Signals がこれほど効率的なのか、React との内部的なレンダリング挙動の違いなど、エンジニア向けの深掘り記事を書きました。
> 👉 [詳解：ReactとPreact Native (Signals) の技術的差異](/blog/deep-dive-react-vs-preact-native/)

## まとめ：まずは「ポート（移植）」から始めよう

今回の検証で分かったのは、**「Preactへの移植はコスパ最強の最適化である」** ということです。

1. まずは環境を Preact に変え、インポートを書き換える（Port版）。
2. さらにパフォーマンスを極めたい、あるいはPreactの強みを活かしたい場合に Signals（Native版）を検討する。

このステップで進めるのが、開発コストと恩恵のバランスが最も良いと感じました。
皆さんも、ぜひ一度軽量化の威力を体感してみてください！

👉 [React版デモ](https://ariaria2021.github.io/tile-merge-game/)
👉 [Preact Port版デモ](https://ariaria2021.github.io/tile-merge-game-preact/port/)
👉 [Preact Native (Signals) 版デモ](https://ariaria2021.github.io/tile-merge-game-preact/native/)
