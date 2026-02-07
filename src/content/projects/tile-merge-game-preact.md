---
title: "Tile Merge Game (Preact Edition)"
description: "React版をPreactに移植・最適化。Port版とSignalsを使用したNative版の2種類を同時公開。"
date: 2026-02-07
tags: ["Preact", "Signals", "Performance", "TypeScript", "Vite"]
github: "https://github.com/ariaria2021/tile-merge-game-preact"
demo: "https://ariaria2021.github.io/tile-merge-game-preact/native/"
image: ""
featured: false
---

## 概要

既存のReact版「Tile Merge Game」をPreactで再構築したプロジェクトです。
「単純な移植」と「Signalsによるネイティブ最適化」の2つの実装を1つのモノレポで管理しています。

## 比較ポイント

- **Port版**: `preact/hooks` を使用。React版から最小限のコード変更で移植。
- **Native版**: `@preact/signals` を採用。コンポーネントの再レンダリングを最小化した、Preactの真骨頂。
- **サイズ**: React版の約200kBから **27kB** まで極限まで軽量化。

## コンテンツ

- [React vs Preact の比較ブログ記事](/blog/react-vs-preact-comparison)
- [Preact Port版 デモ](https://ariaria2021.github.io/tile-merge-game-preact/port/)
- [Preact Native (Signals) 版 デモ](https://ariaria2021.github.io/tile-merge-game-preact/native/)

## 技術詳細

モノレポ構成を採用し、共通のユーティリティを共有しつつ、状態管理手法の違いによるパフォーマンス特性の差を検証できるようにしています。
Native版ではSignalによる細粒度更新によって、アニメーションの滑らかさとレンダリング効率のさらなる向上を図りました。
