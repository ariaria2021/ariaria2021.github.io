---
title: "JSONata Learning"
description: "JSONataを基礎からAWS Step Functions + DynamoDB実践まで学べる4択クイズ & インタラクティブ・プレイグラウンド。"
date: 2026-02-28
tags: ["TypeScript", "Vite", "JSONata", "AWS", "Education"]
github: "https://github.com/ariaria2021/jsonata-learning"
demo: "https://ariaria2021.github.io/jsonata-learning/"
image: ""
featured: true
---

## 概要

JSON経験者が、JSONataのクエリ・変換言語を効率的に学ぶための学習Webアプリです。
AWS Step FunctionsでDynamoDB ScanのJSONデータをJSONataで変換して通常のJSONで返せるようになることがゴールです。

## 機能

- **4択クイズ**: 3セクション・全24問で基礎から実践までカバー
    - Section 1: JSONata基礎（パス式・ワイルドカード・配列フィルタ）
    - Section 2: 関数と変換（$string, $map, $filter, 条件式, オブジェクト構築）
    - Section 3: DynamoDB JSON + Step Functions（型変換・{% %}構文・$states変数）
- **インタラクティブ・プレイグラウンド**: 各問題にJSONata式をその場で実行できるエディタ付き
- **フリー・プレイグラウンド**: 任意のJSONとJSONata式を自由に試せる
- **進捗トラッキング**: セクションごとの正答率をlocalStorageに保存

## 技術詳細

**Vanilla TypeScript** と **Vite** で構築（フレームワーク不使用）。
JSONataの実行には `jsonata` npm パッケージをブラウザバンドルとして使用しています。
`ariaria2021.github.io` と統一されたダークテーマで、モバイルレスポンシブ対応。
