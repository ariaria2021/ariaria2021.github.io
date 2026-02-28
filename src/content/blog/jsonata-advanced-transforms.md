---
title: "JSONata実践 — 関数・条件式・オブジェクト構築でデータ変換"
description: "JSONataの組み込み関数（$string, $number, $map, $filter, $sum等）、三項演算子、オブジェクト構築を使ったデータ変換テクニックを解説します。"
date: 2026-02-28
tags: ["JSONata", "JSON", "AWS", "Tutorial"]
draft: false
---

[前回の入門記事](/blog/jsonata-introduction)では、JSONataの基本構文（パス式・フィルタ・ワイルドカード）を学びました。今回は **関数・条件式・オブジェクト構築** を使った実践的なデータ変換を解説します。

## 型変換関数

JSONataには型を変換する組み込み関数があります。

| 関数 | 用途 | 例 |
|------|------|-----|
| `$string(value)` | 文字列に変換 | `$string(42)` → `"42"` |
| `$number(value)` | 数値に変換 | `$number("3.14")` → `3.14` |
| `$boolean(value)` | 真偽値に変換 | `$boolean(1)` → `true` |

特に `$number()` は、DynamoDB JSONで数値が文字列として格納されている場合（`{"N": "25"}`）の変換で頻繁に使います。

## 集計関数

配列データの集計に使う関数群です。

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

| 式 | 結果 | 説明 |
|----|------|------|
| `$sum(Items.price)` | `600` | 合計 |
| `$count(Items)` | `3` | 要素数 |
| `$average(Items.price)` | `200` | 平均 |
| `$max(Items.price)` | `300` | 最大値 |
| `$min(Items.price)` | `100` | 最小値 |

SQLの `SUM()`, `COUNT()`, `AVG()` と同じ感覚で使えます。

## 文字列関数

文字列操作に使える関数も充実しています。

| 関数 | 例 | 結果 |
|------|-----|------|
| `$uppercase(s)` | `$uppercase("hello")` | `"HELLO"` |
| `$lowercase(s)` | `$lowercase("HELLO")` | `"hello"` |
| `$trim(s)` | `$trim(" hi ")` | `"hi"` |
| `$length(s)` | `$length("hello")` | `5` |
| `$substring(s,start,len)` | `$substring("hello",0,3)` | `"hel"` |
| `$join(arr, sep)` | `$join(["a","b","c"], "-")` | `"a-b-c"` |

### 文字列結合演算子 `&`

JSONataでは文字列結合に `&` を使います（JavaScriptの `+` ではありません）。

```
FirstName & " " & LastName
// → "Taro Yamada"
```

## 条件式（三項演算子）

JavaScriptと同じ三項演算子が使えます。

```
age >= 20 ? "成人" : "未成年"
```

ネストも可能です：

```
score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D"
```

## 高階関数 — `$map`, `$filter`, `$reduce`

配列を処理する強力な高階関数があります。

### `$map(array, function)`

各要素に関数を適用して新しい配列を返します。

```
// 各価格を2倍に
$map(prices, function($v) { $v * 2 })
// [100, 200, 300] → [200, 400, 600]
```

### `$filter(array, function)`

条件を満たす要素だけを残します。

```
$filter(Items, function($v) { $v.price > 150 })
```

> **ヒント**: 多くの場合、フィルタ式 `Items[price > 150]` のほうが簡潔に書けます。`$filter` は複雑な条件で使いましょう。

### `$reduce(array, function, init)`

配列を1つの値に畳み込みます。

```
$reduce(Items.price, function($prev, $curr) { $prev + $curr }, 0)
// → 600
```

## オブジェクト構築

JSONataの最も強力な機能の1つが、式の中で新しいオブジェクトを構築できることです。

```json
// 入力
{
  "FirstName": "Taro",
  "LastName": "Yamada",
  "BirthYear": 1990
}
```

```
// JSONata式
{
  "fullName": FirstName & " " & LastName,
  "age": 2026 - BirthYear,
  "greeting": "Hello, " & FirstName & "!"
}
```

```json
// 結果
{
  "fullName": "Taro Yamada",
  "age": 36,
  "greeting": "Hello, Taro!"
}
```

### 配列のマッピング構文

配列の各要素を新しいオブジェクトに変換する「マッピング構文」は特に強力です。

```
Items.{ "商品名": name, "税込価格": price * 1.1 }
```

```json
// 結果
[
  {"商品名": "Apple", "税込価格": 110},
  {"商品名": "Banana", "税込価格": 220},
  {"商品名": "Cherry", "税込価格": 330}
]
```

この構文は `$map()` の糖衣構文とも言えますが、はるかに読みやすくなります。

## まとめ

| カテゴリ | 主な関数/構文 |
|----------|-------------|
| 型変換 | `$string`, `$number`, `$boolean` |
| 集計 | `$sum`, `$count`, `$average`, `$max`, `$min` |
| 文字列 | `$join`, `$uppercase`, `$trim`, `&`演算子 |
| 条件式 | `条件 ? 真 : 偽` |
| 高階関数 | `$map`, `$filter`, `$reduce` |
| 構築 | `{ "key": 式 }`, `array.{ "key": 式 }` |

次回は [DynamoDB JSON + Step FunctionsでのJSONata活用](/blog/jsonata-dynamodb-stepfunctions) で、AWS実践編に入ります。DynamoDB Scanの結果をJSONataで変換するパターンを学びましょう。

実際に手を動かして学びたい方は [JSONata Learning アプリ](https://ariaria2021.github.io/jsonata-learning/) もぜひ試してみてください！
