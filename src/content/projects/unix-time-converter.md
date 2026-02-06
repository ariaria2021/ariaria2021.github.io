---
title: "Unix Time Converter"
description: "Unixタイムスタンプ・日時・期間の相互変換を行う、クリーム色基調の洗練されたWebツール。"
date: 2026-02-06
tags: ["TypeScript", "Vite", "Utility", "Tool"]
github: "https://github.com/ariaria2021/unix-time-converter"
demo: "https://ariaria2021.github.io/unix-time-converter/"
image: ""
featured: true
---

## 概要

開発者が日常的に遭遇する「Unix秒と日時の変換」や「何秒は何時間何分か」という計算を、シンプルかつ美しく解決するためのツールです。
前作のタワーディフェンスと同様、目に優しいクリーム色を基調としたモダン・ヴィンテージなデザインを採用しています。

## 機能

- **Unix ⇄ Date 変換**: 
    - タイムスタンプを即座に日時に変換。
    - **時差（Offset）対応**: デフォルトのJST(+9)だけでなく、任意の時差を入力して現地時間を確認可能。
    - UTC時間も併記。
- **Date ⇄ Unix 変換**: 
    - ブラウザのカレンダーUIから直感的に日時を選択し、Unix秒を取得。
- **Duration 変換**: 
    - 秒数を「1時間1分1秒」のような人間が読みやすい形式に変換（逆も可能）。
- **リアルタイム更新**: 
    - 入力した瞬間にすべての結果が計算され、シームレスな体験を提供。

## 技術詳細

Reactなどの重量級フレームワークを使用せず、**Vanilla TypeScript** と **Vite** だけで構築することで、圧倒的な軽量さと爆速の起動を実現しています。
CSS Variablesを活用したカラーマネジメントや、Flexbox/Gridを組み合わせたモダンなレスポンシブデザインにより、スマートフォンとデスクトップの両方で一貫した「プレミアムな質感」を提供しています。
