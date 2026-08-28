---
title: "TypeScript / JSDoc の型定義を過信しない — 静的型と実行時エラーの罠・型ガード実践メモ"
description: "TypeScript や JSDoc で型を定義していても実行時エラーは防げません。静的型チェックの限界と、素の型ガード（Type Guard）の実装パターン、自作時の落とし穴、Ajv などのバリデータ活用方針を整理した技術メモです。"
date: 2026-08-28
tags: ["JavaScript", "TypeScript", "JSDoc", "Web開発", "Tips"]
draft: false
---

JavaScript 開発において「型がなくて不安」という理由から TypeScript や JSDoc を導入するケースは多いと思います。

しかし、**「型定義を付けたから絶対に安全」と過信するのは危険**です。
TypeScript や JSDoc はあくまでコンパイル時（エディタ上）の静的解析ツールであり、**実行時（ランタイム）の実際のデータ型まで保証するものではありません**。

特に外部入力との境界線（API レスポンス、JSON パース、Web Storage、ユーザー入力など）では、エディタ上で警告が出ていなくても実行時に `NaN` が発生したり、例外でクラッシュする事故が起こり得ます。

本稿では、静的型の限界と素の型ガード（Type Guard）の実装、自作時の落とし穴、バリデーションライブラリ（Ajv）を活用した安全な設計について整理します。

---

## 1. 静的型チェックと実行時の乖離

```
【外部入力の境界線】
API レスポンス / JSON 文字列 / localStorage / フォーム入力
   │
   │ 不正なデータ・文字列・null が届く可能性
   ▼
[ 境界処理 (JSON.parse など) ] ─── 戻り値は any または型アサーション
   │
   ▼
TypeScript / JSDoc の世界
   │ 「型定義があるから安全」と思い込んで処理を記述
   ▼
【実行時にクラッシュ or NaN の発生】
```

- **静的型チェック**: 開発時にコードの整合性を検証します（実行時には型情報は消滅します）。
- **型アサーション (`as Type` / JSDoc `@type`)**: 「この値はこの型である」と開発者がコンパイラに宣言（指示）する機能であり、実行時のデータ検証は一切行われません。
- **`JSON.parse()` の挙動**: 戻り値が暗黙の `any` になるため、後続のアクセスですべての型チェックが無効化されます。

---

## 2. 具体例：数値演算で静かにバグる / クラッシュするケース

動画や音声の再生時間データ（秒数 `durationSeconds`）を受け取り、**「2分5秒」** のように分と秒を計算してフォーマットする処理を例にとります。

```typescript
interface VideoTrack {
  title: string;
  durationSeconds: number; // 例: 125 (秒)
}

function formatDuration(jsonString: string): string {
  // JSON.parse の戻り値は暗黙の any
  const track = JSON.parse(jsonString);

  // durationSeconds が number 前提で計算（エディタ上の警告は出ません）
  const minutes = Math.floor(track.durationSeconds / 60);
  const seconds = track.durationSeconds % 60;

  return `${track.title}（再生時間: ${minutes}分${seconds}秒）`;
}
```

このコードはエディタ上の静的解析をパスしますが、渡される入力データによって以下のような問題が発生します。

| 入力データ例 | 実行結果 | 問題点 |
| :--- | :--- | :--- |
| `{"title": "BGM", "durationSeconds": 125}` | `BGM（再生時間: 2分5秒）` | 正常動作 |
| `{"title": "BGM", "durationSeconds": "125秒"}` | `BGM（再生時間: NaN分NaN秒）` | 文字列が混入。エラーで停止せず不正な表示が残ります |
| `{"title": "BGM"}` | `BGM（再生時間: NaN分NaN秒）` | `durationSeconds` が `undefined` となり計算不能になります |
| `'null'` | `TypeError: Cannot read properties of null` | `null.durationSeconds` 参照でクラッシュします |

---

## 3. 素の型ガード（Type Guard）による基本対策

外部ライブラリを導入せず、素の JavaScript / TypeScript で安全性を担保する手順です。

### ステップ 1: `any` を排除し `unknown` で受け取る
何が入っているか不明なデータは `any` ではなく `unknown` として扱います。

### ステップ 2: ユーザー定義型ガード関数を実装する
```typescript
interface VideoTrack {
  title: string;
  durationSeconds: number;
}

/**
 * 実行時にオブジェクトの構造と型を検証する型ガード関数
 */
function isVideoTrack(value: unknown): value is VideoTrack {
  // 1. null および非オブジェクトを除外
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // 2. プロパティの型を検証
  const candidate = value as Record<string, unknown>;
  const hasValidTitle = typeof candidate.title === 'string';
  const hasValidDuration =
    typeof candidate.durationSeconds === 'number' &&
    !Number.isNaN(candidate.durationSeconds) &&
    candidate.durationSeconds >= 0;

  return hasValidTitle && hasValidDuration;
}
```

### ステップ 3: 型ガードを通した安全な処理
```typescript
function formatDurationSafe(jsonString: string): string {
  let rawData: unknown;

  try {
    rawData = JSON.parse(jsonString);
  } catch {
    return '不正な JSON フォーマットです';
  }

  // 型ガードによる絞り込み
  if (!isVideoTrack(rawData)) {
    return '不正なトラックデータ形式です';
  }

  // ここ以降 rawData は VideoTrack 型として安全にアクセス可能です
  const minutes = Math.floor(rawData.durationSeconds / 60);
  const seconds = rawData.durationSeconds % 60;

  return `${rawData.title}（再生時間: ${minutes}分${seconds}秒）`;
}
```

---

## 4. 自作型ガードに潜む 3 つの落とし穴

素の型ガードは外部依存がなく手軽ですが、自作する際にはいくつか注意すべき点があります。

### ① `typeof null === 'object'` の罠
JavaScript の仕様上、`typeof null` は `'object'` を返します。
```javascript
typeof null === 'object' // true になる
```
`typeof val === 'object'` だけで判定すると `null` がすり抜けて `TypeError` の原因になります。必ず `value !== null` のチェックを併用する必要があります。

### ② 型述語（`value is T`）の実装ミスを検知できない
型ガード関数の戻り値型に `value is VideoTrack` を指定した場合、**関数内部の実装が間違っていてもコンパイラは警告してくれません**。

```typescript
function isVideoTrack(value: unknown): value is VideoTrack {
  // durationSeconds のチェックを書き忘れていますが、コンパイルエラーにはなりません
  return typeof value === 'object' && value !== null;
}
```

### ③ データ構造の複雑化によるコード肥大化
ネストしたオブジェクト（`meta.artist.name` など）や配列（`tags: string[]`）が含まれる場合、検証コードが急激に複雑化し、バリデーション漏れやバグが混入しやすくなります。

---

## 5. バリデーションライブラリの活用（Ajv による実装例）

自作の型ガードが大変な場合や、JSON Schema 資産を活かしたい場合は、実績のある **Ajv (Another JSON Schema Validator)** などのバリデーションライブラリを活用するのが手堅い選択肢です。

### Ajv による実装

TypeScript 環境では、Ajv の提供する `JSONSchemaType<T>` を使うことで、**TypeScript の型定義と JSON Schema の整合性をコンパイル時にチェック** できます。

```typescript
import Ajv, { JSONSchemaType } from 'ajv';

interface VideoTrack {
  title: string;
  durationSeconds: number;
}

const ajv = new Ajv();

// TypeScript 型と同期したスキーマ定義
const schema: JSONSchemaType<VideoTrack> = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    durationSeconds: { type: 'number', minimum: 0 },
  },
  required: ['title', 'durationSeconds'],
  additionalProperties: false,
};

// コンパイル済みバリデータ（型ガードとして機能する）
const validate = ajv.compile(schema);

function formatDurationWithAjv(jsonString: string): string {
  let rawData: unknown;

  try {
    rawData = JSON.parse(jsonString);
  } catch {
    return '不正な JSON フォーマットです';
  }

  // validate(rawData) が true の場合、TypeScript 上で rawData は VideoTrack 型に絞り込まれる
  if (!validate(rawData)) {
    return 'バリデーションエラー: データ形式が不正です';
  }

  // rawData は VideoTrack として安全にアクセス可能
  const minutes = Math.floor(rawData.durationSeconds / 60);
  const seconds = rawData.durationSeconds % 60;

  return `${rawData.title}（再生時間: ${minutes}分${seconds}秒）`;
}
```

### Ajv を使うメリット
1. **型ガードとして直接機能する**:
   `validate(raw)` の判定が通ると、TypeScript コンパイラが `raw` を自動的に `VideoTrack` 型として認識します。
2. **スキーマ定義のミスを TS が検知**:
   `JSONSchemaType<VideoTrack>` を指定しているため、もし `VideoTrack` に新しいプロパティを追加したのにスキーマの更新を忘れた場合、TypeScript がコンパイルエラーで教えてくれます。
3. **JSON Schema の共通化**:
   OpenAPI（Swagger）やバックエンドと共通の JSON Schema 定義をそのまま流用できます。

> **参考（Zod について）**:  
> 近年の TypeScript エコシステムでは、スキーマ定義から TypeScript の型を自動抽出できる **Zod** や **Valibot** も人気があります。プロジェクトの要件（JSON Schema 標準を重視するなら Ajv、TypeScript で完結させたいなら Zod など）に合わせて選定すると良いでしょう。

---

## 6. 使い分けと設計のまとめ

- **基本原則**:
  - 静的型は「内部ロジックの設計・エディタ支援」のためのものです。
  - 外部との境界（I/O）には必ず「ランタイムバリデーション」を設ける必要があります。
- **使い分けの目安**:
  - **素の型ガード**: 単純なプリミティブ判定や、依存ライブラリを増やしたくない小さなユーティリティ。
  - **Ajv**: JSON Schema / OpenAPI 仕様をそのまま流用したい場合や、複雑な構造を確実に検証したい場合。
  - **Zod / Valibot**: TypeScript ファーストでスキーマ定義から型を自動生成したい場合。
