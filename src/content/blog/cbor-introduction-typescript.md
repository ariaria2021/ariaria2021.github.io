---
title: "CBOR入門 — バイナリのデータフォーマットをTypeScriptで触ってみる"
description: "JSONに似たデータモデルを持つバイナリフォーマット「CBOR（RFC 8949）」の基礎知識と、TypeScript（cbor-x）を使ったエンコード・デコード、データサイズ比較、タグ付き値の活用方法を解説します。"
date: 2026-08-29
tags: ["TypeScript", "CBOR", "WebAuthn", "RFC8949", "Web開発"]
draft: true
---

CBOR（Concise Binary Object Representation）は、JSONに似たデータモデルを持つバイナリのデータフォーマットです。[RFC 8949](https://www.rfc-editor.org/rfc/rfc8949)で標準化されており、WebAuthnやCOSE（CBOR版のJWTのようなもの）、IoTデバイス間の通信などで使われています。こうした場所を扱う機会があると、CBORを避けて通れないことがあります。この記事では、TypeScriptで実際にエンコード・デコードしながらCBORの基本を見ていきます。

## CBORのデータモデル

CBORが表現できる値は、JSONとほぼ同じ感覚で扱えます。

- 整数（正・負）
- 浮動小数点数
- バイト列（bstr）
- テキスト文字列（tstr）
- 配列
- マップ（連想配列）
- タグ付き値（日時やビッグナンバーなど、意味づけを追加できる値）
- true / false / null / undefined

JSONとの一番の違いは、テキストではなくバイナリで表現される点です。各値の型や長さ情報が先頭バイト（および必要に応じて後続の追加情報バイト）に埋め込まれているため、パーサーが先読みなしで要素の境界を判断できるようになっています。

## メジャータイプ（Major Type）

CBORの各値は、先頭1バイトの上位3ビットで「メジャータイプ」を表し、下位5ビットで「追加情報（長さや値そのもの）」を表します。

| Major Type | 意味 |
|---|---|
| 0 | 符号なし整数 |
| 1 | 負の整数 |
| 2 | バイト列 |
| 3 | テキスト文字列 |
| 4 | 配列 |
| 5 | マップ |
| 6 | タグ付き値 |
| 7 | 浮動小数点数・特殊値（true/false/null等） |

この構造の詳細は、[RFC 8949 §3](https://www.rfc-editor.org/rfc/rfc8949#section-3)にまとまっています。

## TypeScriptでエンコード・デコードする

`cbor-x` パッケージを使うと、手軽に試せます。

```bash
npm install cbor-x
```

```typescript
import { encode, decode } from "cbor-x";

// エンコード：JSのオブジェクトをCBORバイト列に変換
const data = {
  name: "Alice",
  age: 30,
  tags: ["admin", "user"],
};

const encoded: Uint8Array = encode(data);
console.log(Buffer.from(encoded).toString("hex"));
// => b90003646e616d6565416c69636563616765181e6474616773826561646d696e6475736572

// デコード：バイト列を元のオブジェクトに戻す
const decoded = decode(encoded);
console.log(decoded);
// => { name: 'Alice', age: 30, tags: [ 'admin', 'user' ] }
```

エンコードされたバイト列は、Buffer（バイナリ）としてファイルに保存したり、ネットワーク越しに送ったりできます。`JSON.stringify` したテキストよりもサイズがコンパクトになるのが特徴です。

## サイズを比較してみる

同じデータをJSONとCBORでエンコードして、サイズを比べてみます。

```typescript
import { encode } from "cbor-x";

const data = {
  id: 1,
  name: "Alice",
  active: true,
  scores: [10, 20, 30],
};

const jsonSize = Buffer.byteLength(JSON.stringify(data));
const cborSize = encode(data).length;

console.log(`JSON: ${jsonSize} bytes`);
console.log(`CBOR: ${cborSize} bytes`);
```

データの内容によって差は変わりますが、数値や真偽値が多いデータほどCBORのほうがコンパクトになりやすい傾向があります。

## タグ付き値の例

CBORには「タグ」という仕組みがあり、値に意味づけを追加できます。たとえば日時を表すタグ(0)を使うと、以下のように書けます。

```typescript
import { encode, decode, Tag } from "cbor-x";

const tagged = new Tag(new Date().toISOString(), 0);
const encoded = encode(tagged);
const decoded = decode(encoded);

console.log(decoded);
// => 2026-08-29T... (cbor-x では Tag 0 が Date オブジェクトに自動復元される)

// 組み込み拡張のないカスタムタグの場合は Tag インスタンスとして取得される
const customTagged = new Tag("some-value", 42);
console.log(decode(encode(customTagged)));
// => Tag { value: 'some-value', tag: 42 }
```

タグの一覧は[RFC 8949 §3.4](https://www.rfc-editor.org/rfc/rfc8949#section-3.4)や[IANAのCBOR Tags レジストリ](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml)で確認できます。

## まとめ

- CBORはJSONに似たデータモデルを持つバイナリフォーマットで、[RFC 8949](https://www.rfc-editor.org/rfc/rfc8949)で標準化されています
- WebAuthnやCOSEなど、扱う場面によっては必須になることがあります
- TypeScriptでは `cbor-x` のようなライブラリを使えば、簡単にエンコード・デコードが試せます
- タグを使うことで、日時やビッグナンバーなどに意味づけを追加できます

次はCOSEやWebAuthnでの実際の使われ方を見てみると、CBORの実用例としてさらに理解が深まりそうです。
