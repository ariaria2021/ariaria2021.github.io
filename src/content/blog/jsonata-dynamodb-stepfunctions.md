---
title: "DynamoDB JSON + Step Functions — JSONataでLambdaなしデータ変換"
description: "AWS Step FunctionsのJSONataサポートを使い、DynamoDB ScanのJSON結果をLambda関数なしで通常JSONに変換する方法を具体的に解説します。"
date: 2026-02-28
tags: ["JSONata", "AWS", "DynamoDB", "Step Functions", "Tutorial"]
draft: false
---

シリーズ最終回は、ここまで学んだJSONataの知識を **AWS Step Functions + DynamoDB** で実践します。

[第1回: JSONata入門](/blog/jsonata-introduction) / [第2回: JSONata実践](/blog/jsonata-advanced-transforms)

## ゴール

> **DynamoDB Scanで取得したDynamoDB JSONデータを、JSONataでフィルタ・変換し、通常のJSONで返す**

これまではLambda関数を挟んでいた変換処理を、Step Functionsの設定だけで完結させます。

## DynamoDB JSONとは

DynamoDBのAPIレスポンスは、通常のJSONとは異なる「型付きJSON」形式です。

```json
// 通常のJSON
{
  "UserId": "user-001",
  "Name": "Alice",
  "Age": 30,
  "Active": true
}
```

```json
// DynamoDB JSON
{
  "UserId": {"S": "user-001"},
  "Name": {"S": "Alice"},
  "Age": {"N": "30"},
  "Active": {"BOOL": true}
}
```

### 主な型記述子

| 記述子 | 型 | 例 |
|--------|-----|-----|
| `S` | String | `{"S": "hello"}` |
| `N` | Number（文字列で格納） | `{"N": "42"}` |
| `BOOL` | Boolean | `{"BOOL": true}` |
| `L` | List | `{"L": [{"S": "a"}, {"S": "b"}]}` |
| `M` | Map | `{"M": {"key": {"S": "value"}}}` |
| `NULL` | Null | `{"NULL": true}` |

> **注意**: 数値（`N`）は精度維持のため **文字列として** 格納されます。JSONataで数値比較するには `$number()` での変換が必要です。

## DynamoDB Scan結果の構造

`DynamoDB:Scan` アクションの結果は以下のような形になります：

```json
{
  "Count": 3,
  "Items": [
    {
      "UserId": {"S": "user-001"},
      "Name": {"S": "Alice"},
      "Age": {"N": "30"}
    },
    {
      "UserId": {"S": "user-002"},
      "Name": {"S": "Bob"},
      "Age": {"N": "25"}
    },
    {
      "UserId": {"S": "user-003"},
      "Name": {"S": "Carol"},
      "Age": {"N": "28"}
    }
  ],
  "ScannedCount": 3
}
```

## JSONataでの変換

### 基本: 通常JSONへの変換

```
Items.{
  "id": UserId.S,
  "name": Name.S,
  "age": $number(Age.N)
}
```

結果：

```json
[
  {"id": "user-001", "name": "Alice", "age": 30},
  {"id": "user-002", "name": "Bob", "age": 25},
  {"id": "user-003", "name": "Carol", "age": 28}
]
```

ポイント：
- `.S` で文字列値を取り出す
- `$number(.N)` で数値に変換する
- マッピング構文 `array.{新構造}` で一括変換

### フィルタ付き: 条件で絞り込んで変換

Age > 25 のユーザーだけを取得する場合：

```
Items[$number(Age.N) > 25].{
  "id": UserId.S,
  "name": Name.S,
  "age": $number(Age.N)
}
```

結果：

```json
[
  {"id": "user-001", "name": "Alice", "age": 30},
  {"id": "user-003", "name": "Carol", "age": 28}
]
```

`$number(Age.N)` でフィルタ内でも型変換しているのがポイントです。

## Step FunctionsでのJSONata設定

### QueryLanguageの設定

Step FunctionsでJSONataを使うには、ステートマシン定義で `QueryLanguage` を指定します：

```json
{
  "Comment": "DynamoDB Scan with JSONata",
  "QueryLanguage": "JSONata",
  "StartAt": "ScanUsers",
  "States": {
    "ScanUsers": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:scan",
      "Arguments": {
        "TableName": "Users"
      },
      "Output": "{% $states.result.Items[$number(Age.N) > 25].{\"id\": UserId.S, \"name\": Name.S, \"age\": $number(Age.N)} %}",
      "End": true
    }
  }
}
```

### `{% %}` デリミタ

JSONata式はASL内で `{% %}` で囲みます。この中にJSONata式を記述します。

### 主要フィールド

JSONataモードでは、従来の5つのJSONPathフィールドが2つに置き換わります：

| 従来（JSONPath） | JSONataモード | 用途 |
|----------|--------|------|
| `InputPath` + `Parameters` | **`Arguments`** | アクションに送るデータ |
| `ResultPath` + `ResultSelector` + `OutputPath` | **`Output`** | 結果の変換 |

### 予約変数

| 変数 | 内容 |
|------|------|
| `$states.input` | ステートへの入力データ |
| `$states.result` | タスク実行の結果 |
| `$states.errorOutput` | エラー情報 |
| `$states.context` | コンテキスト情報（実行ARN等） |

### Assign — 変数の保存

`Assign` フィールドでワークフロー変数に値を保存し、後続ステートで再利用できます：

```json
{
  "ScanUsers": {
    "Type": "Task",
    "Resource": "arn:aws:states:::dynamodb:scan",
    "Arguments": {
      "TableName": "Users"
    },
    "Assign": {
      "userCount": "{% $count($states.result.Items) %}",
      "filteredUsers": "{% $states.result.Items[$number(Age.N) > 25].{\"id\": UserId.S, \"name\": Name.S} %}"
    },
    "Next": "ProcessResults"
  }
}
```

後続ステートでは `$userCount` や `$filteredUsers` として参照可能です。

## 実践例: 完全なステートマシン

DynamoDBからユーザーをScan → フィルタ → 整形して返す完全な例：

```json
{
  "Comment": "DynamoDB を JSONata でフィルタ・変換",
  "QueryLanguage": "JSONata",
  "StartAt": "ScanTable",
  "States": {
    "ScanTable": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:scan",
      "Arguments": {
        "TableName": "{% $states.input.tableName %}"
      },
      "Assign": {
        "rawItems": "{% $states.result.Items %}"
      },
      "Next": "TransformData"
    },
    "TransformData": {
      "Type": "Pass",
      "Output": {
        "users": "{% $rawItems[$number(Age.N) > 25].{\"id\": UserId.S, \"name\": Name.S, \"age\": $number(Age.N)} %}",
        "totalCount": "{% $count($rawItems) %}",
        "filteredCount": "{% $count($rawItems[$number(Age.N) > 25]) %}"
      },
      "End": true
    }
  }
}
```

入力: `{"tableName": "Users"}`

出力:
```json
{
  "users": [
    {"id": "user-001", "name": "Alice", "age": 30},
    {"id": "user-003", "name": "Carol", "age": 28}
  ],
  "totalCount": 3,
  "filteredCount": 2
}
```

**Lambda関数はゼロ**。ステートマシンの定義だけで、データの取得・フィルタ・変換がすべて完結しています。

## まとめ

| ステップ | やること |
|----------|---------|
| 1. QueryLanguage設定 | `"QueryLanguage": "JSONata"` |
| 2. DynamoDB Scan | `Arguments` でテーブル名を指定 |
| 3. 型変換 | `.S` で文字列、`$number(.N)` で数値を取り出す |
| 4. フィルタ | `Items[条件]` で絞り込み |
| 5. 変換 | `array.{新しい構造}` で通常JSONに整形 |
| 6. 出力/変数保存 | `Output` で最終結果、`Assign` で中間変数を保存 |

これでJSONataの基礎から実践まで一通り学べました。ぜひ [JSONata Learning アプリ](https://ariaria2021.github.io/jsonata-learning/) で復習してみてください！

## 関連リンク

- [JSONata公式ドキュメント](https://docs.jsonata.org/)
- [AWS Step Functions — JSONataサポート](https://docs.aws.amazon.com/step-functions/latest/dg/transforming-data.html)
- [JSONata Learning アプリ](https://ariaria2021.github.io/jsonata-learning/)
