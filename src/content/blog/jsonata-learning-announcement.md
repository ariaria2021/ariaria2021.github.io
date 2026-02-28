---
title: "JSONata学習アプリを作りました！"
description: "4択クイズ + プレイグラウンドで、JSONataを基礎からAWS Step Functions実践まで学べるWebアプリの紹介です。"
date: 2026-02-28
tags: ["JSONata", "TypeScript", "DevLog", "AWS"]
draft: false
---

新しいプロジェクト「[JSONata Learning](https://ariaria2021.github.io/jsonata-learning/)」を公開しました！

## どんなアプリ？

**JSONを知っている人** が **JSONata** を学ぶための4択クイズ + インタラクティブ・プレイグラウンドです。

最終ゴールは、**AWS Step FunctionsでDynamoDB ScanのJSONデータをJSONataで変換して通常のJSONで返せるようになること**。

## 3つのセクション

| セクション | 内容 | 問題数 |
|-----------|------|--------|
| JSONata基礎 | パス式、ワイルドカード、配列フィルタ、ソート | 8問 |
| 関数と変換 | $string, $map, $filter, 条件式, オブジェクト構築 | 8問 |
| DynamoDB JSON + Step Functions | 型変換、{% %}構文、$states変数、実践パターン | 8問 |

## 特徴

### 🎯 正解でも不正解でも解説が見れる

4択を選ぶと、正解・不正解に関わらず詳しい解説が表示されます。「なぜその答えなのか」を理解できるので、暗記ではなく本質的な理解が身につきます。

### 🛝 その場で試せるプレイグラウンド

各問題にJSONata式を実際に入力・実行できるエディタが付いています。解説を読んだあと、自分で式を書き換えて試すことで、理解が定着します。

MDNのJavaScript解説ページにある「試してみましょう」セクションのイメージです。

### 📝 フリー・プレイグラウンド

ナビゲーションの「プレイグラウンド」タブから、任意のJSONとJSONata式を自由に試せます。

## 技術スタック

- **Vanilla TypeScript + Vite** — フレームワーク不使用で軽量
- **jsonata npm パッケージ** — ブラウザ上でJSONataの式をリアルタイム実行
- **GitHub Pages** — 自動デプロイ

## 併せて読みたいブログ記事

アプリと並行して、JSONataの解説記事も全3回で書きました：

1. [JSONata入門 — JSON経験者のためのクエリ言語ガイド](/blog/jsonata-introduction)
2. [JSONata実践 — 関数・条件式・オブジェクト構築でデータ変換](/blog/jsonata-advanced-transforms)
3. [DynamoDB JSON + Step Functions — JSONataでLambdaなしデータ変換](/blog/jsonata-dynamodb-stepfunctions)

ぜひアプリと記事を行き来しながら学んでみてください！

👉 **[JSONata Learning アプリ](https://ariaria2021.github.io/jsonata-learning/)**
