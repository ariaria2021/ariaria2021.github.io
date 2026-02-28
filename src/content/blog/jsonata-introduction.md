---
title: "JSONata入門 — JSON経験者のためのクエリ言語ガイド"
description: "JSONを知っている人向けに、JSONataの基本構文・パス式・ワイルドカード・配列フィルタリングを解説します。"
date: 2026-02-28
tags: ["JSONata", "JSON", "AWS", "Tutorial"]
draft: false
---

こんにちは！今回から全3回にわたって **JSONata** を解説していきます。

JSONataは、JSONデータに対して **クエリ・変換** を行うための軽量な式言語です。XPathやSQLに着想を得て設計されており、2024年11月からは **AWS Step Functions** にも公式採用されています。

この記事は「JSONは分かるけどJSONataは初めて」という方向けです。

## JSONataとは？

JSONata は以下の特徴を持ちます：

- **宣言的**: 「何が欲しいか」を書くだけで結果が得られる
- **軽量**: ライブラリは数十KB、ブラウザでもNode.jsでも動く
- **強力**: フィルタ、ソート、集計、オブジェクト構築が1式で完結

SQLを使ったことがある方なら、直感的に理解できるはずです。

## パス式 — ドットで辿る

JSONataの最も基本的な操作は「パス式」です。JavaScriptのドット記法と同じ感覚でフィールドにアクセスできます。

```json
// 入力
{
  "Name": "Alice",
  "Address": {
    "City": "Tokyo",
    "Zip": "100-0001"
  }
}
```

| JSONata式 | 結果 |
|-----------|------|
| `Name` | `"Alice"` |
| `Address.City` | `"Tokyo"` |
| `Address.Zip` | `"100-0001"` |

ネストが深くなっても、ドットを繋ぐだけです。

## 配列アクセス — インデックスで取得

配列へのアクセスはJavaScriptと同じ0始まりのインデックスを使います。

```json
// 入力
{ "Numbers": [10, 20, 30, 40] }
```

| JSONata式 | 結果 |
|-----------|------|
| `Numbers[0]` | `10` |
| `Numbers[2]` | `30` |
| `Numbers[-1]` | `40`（末尾から） |

## 配列のプロパティ自動展開

JSONataの便利機能の1つが「配列の中身に対するプロパティアクセス」です。

```json
// 入力
{
  "Items": [
    {"name": "Apple", "price": 100},
    {"name": "Banana", "price": 200},
    {"name": "Cherry", "price": 300}
  ]
}
```

| JSONata式 | 結果 |
|-----------|------|
| `Items.name` | `["Apple", "Banana", "Cherry"]` |
| `Items.price` | `[100, 200, 300]` |

JavaScriptなら `Items.map(i => i.name)` と書くところを、`Items.name` だけで実現できます。

## ワイルドカード — `*` で全プロパティ

`*` はオブジェクトの全フィールド値を配列で返します。

```json
// 入力
{
  "Address": {
    "City": "Osaka",
    "Zip": "530-0001",
    "Country": "Japan"
  }
}
```

```
// JSONata式
Address.*

// 結果
["Osaka", "530-0001", "Japan"]
```

フィールド名を知らなくても全値を取得したい場合に便利です。

## フィルタ式 — `[]` で条件指定

配列に対して `[条件式]` を書くとフィルタリングができます。SQLの `WHERE` 句に相当します。

```json
// 入力
{
  "Items": [
    {"name": "Apple", "price": 100},
    {"name": "Banana", "price": 200},
    {"name": "Cherry", "price": 300}
  ]
}
```

| JSONata式 | 結果 |
|-----------|------|
| `Items[price > 150]` | Banana, Cherryのオブジェクト |
| `Items[price > 150].name` | `["Banana", "Cherry"]` |
| `Items[name = "Apple"]` | `{"name": "Apple", "price": 100}` |

フィルタとプロパティアクセスをチェーンできるのがJSONataの醍醐味です。

## ソート — `$sort()` 関数

配列のソートには `$sort()` を使います。

```
$sort(Items, function($a, $b) { $a.price > $b.price })
```

比較関数で `$a.price > $b.price` を返すと **昇順**、`$a.price < $b.price` で **降順** になります。

## まとめ

| 概念 | 構文 | 用途 |
|------|------|------|
| パス式 | `field.nested` | フィールドアクセス |
| インデックス | `array[0]` | 配列要素取得 |
| 自動展開 | `array.field` | 全要素からプロパティ抽出 |
| ワイルドカード | `object.*` | 全フィールド値取得 |
| フィルタ | `array[条件]` | 条件で絞り込み |
| ソート | `$sort(array, fn)` | 配列の並べ替え |

次回は [JSONata実践 — 関数と変換](/blog/jsonata-advanced-transforms) で、組み込み関数や条件式、オブジェクト構築について詳しく解説します。

実際に手を動かして学びたい方は [JSONata Learning アプリ](https://ariaria2021.github.io/jsonata-learning/) もぜひ試してみてください！
