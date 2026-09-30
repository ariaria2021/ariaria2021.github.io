---
title: "マージパレット"
description: "テーマごとにタイルの画像・名前・色を切り替えて遊べる、microCMS対応のSvelte製2048パズル。"
date: 2026-09-28
tags: ["Svelte", "TypeScript", "Vite", "microCMS", "GitHub Pages", "Game"]
github: "https://github.com/ariaria2021/merge-palette"
demo: "https://ariaria2021.github.io/merge-palette/"
featured: true
---

## 概要

**マージパレット** は、同じ値のタイルをつなげて大きくする4×4の2048パズルです。合成ルールとスコアは共通のまま、テーマを切り替えるとタイルの画像・表示名・背景色が変わります。

テーマはmicroCMSで管理するため、ゲーム本体を変更せずに、雰囲気の異なる見た目を追加できる設計です。CMSを設定していないときや取得に失敗したときも、内蔵のフォールバック表示で遊び続けられます。

## 機能

- **2048パズル**: スライド、合成、スコア計算、ゲームオーバー判定
- **テーマ切替**: テーマ選択モーダルから画像・名称・配色を即時に切替
- **状態の保存**: 最高スコアと選択テーマをブラウザに保存
- **操作性**: キーボードとスワイプに対応
- **CMSフォールバック**: microCMSの未設定・通信失敗・不正なテーマを安全に扱い、ゲームを継続

## 技術構成

Svelte 5とTypeScriptでUIとゲーム状態を実装し、Viteでビルドしています。microCMSではテーマごとに1コンテンツを作成し、繰り返しフィールド内の12タイルを取得します。

## リンク

- [デモ](https://ariaria2021.github.io/merge-palette/)
- [GitHubリポジトリ](https://github.com/ariaria2021/merge-palette)
