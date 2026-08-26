---
title: "実務で困らない HTTP 429 と Retry-After の扱い方・待機戦略"
description: "HTTP 429 (Too Many Requests) と Retry-After ヘッダーの標準仕様から、AppleやChatworkなど実務で遭遇する独自実装への対応、動作確認済みのTypeScript実装コードまで網羅的に解説します。"
date: 2026-08-27
tags: ["HTTP", "API", "TypeScript", "Web開発", "Tips"]
draft: false
---

外部 API との連携システムやバッチ処理を構築していると、必ずと言っていいほど遭遇するのが **HTTP 429 Too Many Requests**（レートリミット到達エラー）です。

429 エラーを受け取った際、レスポンスヘッダーに含まれる `Retry-After` を見て適切に待機・リトライするのが基本ですが、**「RFC 標準仕様通りに実装したのに、特定のサービスで動かなかった」** という経験はないでしょうか？

この記事では、最新の RFC 仕様から主要サービスの独自仕様、そしてあらゆる形式を安全に処理できる **動作確認済みの TypeScript 実践コード** までを整理して解説します。

---

## 1. Retry-After の標準仕様（RFC 9110 / RFC 6585）

HTTP 429 ステータスコードは **RFC 6585 Section 4** で定義されており、クライアントが次回リクエストを送るまでの待機時間を伝えるために `Retry-After` ヘッダーが利用されます。

最新の HTTP 仕様である **RFC 9110 Section 10.2.3**（※従来の RFC 7231 / RFC 2616 を統合・後継）において、`Retry-After` は次の **2 種類** のいずれかの形式と定められています。

| 形式 | 例 | 意味・解釈 |
| :--- | :--- | :--- |
| **delay-seconds** (秒数) | `Retry-After: 120` | レスポンス受信後、指定された秒数（120秒）待機する |
| **HTTP-date** (日時) | `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT` | 指定された協定世界時（GMT/UTC）の日時まで待機する |

### 標準仕様の注意点
- `delay-seconds` は **非負の整数** です。
- `HTTP-date` は RFC 5322 形式（例: `Wed, 21 Oct 2026 07:28:00 GMT`）であり、クライアント側の時計（クロック）とサーバー側の時計のズレ（クロックスキュー）に注意が必要です。

---

## 2. 実務で遭遇する「標準外」の独自仕様

現実の Web API では、RFC 標準とは異なる形式で待機時刻が返されたり、独自ヘッダーが使われたりするケースが多々あります。

```
【代表的な非標準・独自パターンの例】
┌─────────────────────────────────────────────────────────────┐
│ ① Apple App Store Server API : UNIX time (ミリ秒 / 13桁)    │
│    Retry-After: 1772150020000                               │
│                                                             │
│ ② 10桁 UNIX タイムスタンプ : UNIX time (秒 / 10桁)          │
│    Retry-After: 1772150020                                  │
│                                                             │
│ ③ 独自ヘッダー型 : X-RateLimit-Reset 等                     │
│    x-ratelimit-reset: 1772150020                            │
│                                                             │
│ ④ ドキュメント指示型 : ヘッダー未提供（固定待機を推奨）      │
│    Chatwork API 等の一部エンドポイント                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 UNIX time（ミリ秒 / 13桁）
**Apple App Store Server API** などでは、`Retry-After` に秒数ではなく **UNIX エポックミリ秒** が返されます。

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1772150020000
```
これを単純に `Number(retryAfter) * 1000` で「秒数」として計算してしまうと、**約56,000年待機する** という致命的なバグに繋がります。

### 2.2 UNIX time（秒 / 10桁）
一部の API では、10桁の UNIX タイムスタンプ（秒）が `Retry-After` に設定されるケースもあります。

### 2.3 独自ヘッダー型（X-RateLimit-* / RateLimit-*）
GitHub、Twitter/X、Chatwork、Slack など多くの主要 API では、標準の `Retry-After` とは別に（あるいは代わりに）以下のような独自ヘッダーが利用されます。

- `x-ratelimit-limit`: 期間内の最大許可リクエスト数
- `x-ratelimit-remaining`: 残り許可リクエスト数
- `x-ratelimit-reset`: レートリミットが解除される UNIX タイムスタンプ（秒）

*(※現在 IETF では `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` として標準化策定が進められています)*

### 2.4 ドキュメント指示型（ヘッダーなし）
`Retry-After` も `x-ratelimit-*` も返されない API（または一部のエンドポイント）では、公式ドキュメントに「429 が発生した場合は 10秒程度待機して再試行してください」と指示が記載されている場合があります。

---

## 3. 待機時間の判定フロー

これらの仕様差異を吸収し、安全に待機時間を算出するための判定フローは以下の通りです。

```
[429 受信]
   │
   ├─ Retry-After ヘッダーはあるか？
   │    │
   │    ├─ [Yes] 形式を判定
   │    │    │
   │    │    ├─ 純粋な数値か？
   │    │    │    ├─ 13桁以上 ➔ UNIXミリ秒 (値 - 現在時刻)
   │    │    │    ├─ 10桁 ➔ UNIX秒 (値 * 1000 - 現在時刻)
   │    │    │    └─ それ以外 (1〜6桁等) ➔ 秒数 (値 * 1000)
   │    │    │
   │    │    └─ 日時文字列か？ ➔ Date.parse() でミリ秒差分を算出
   │    │
   │    └─ [No / パース失敗]
   │
   ├─ X-RateLimit-Reset ヘッダーはあるか？
   │    ├─ [Yes] UNIXタイムスタンプから待機時間を算出
   │    └─ [No]
   │
   ▼
[デフォルト待機時間（または指数バックオフ）を適用]
   │
   ▼
[上限キャップ（最大待機時間）を適用して待機]
```

---

## 4. 実践 TypeScript 実装コード

上記の全パターンに対応し、テスト・動作確認済みの堅牢な判定関数です。

```typescript
export interface RetryOptions {
  /** 最大待機時間の上限ミリ秒（デフォルト: 60,000ms = 1分） */
  maxDelayMs?: number;
  /** ヘッダーが存在しない・パース不能な場合のデフォルト待機ミリ秒（デフォルト: 5,000ms） */
  defaultDelayMs?: number;
}

/**
 * レスポンスヘッダーから安全に待機ミリ秒数を算出する
 */
export function getRetryDelayMs(
  headers: Headers | Record<string, string | undefined>,
  options: RetryOptions = {}
): number {
  const { maxDelayMs = 60000, defaultDelayMs = 5000 } = options;
  const now = Date.now();

  const getHeader = (name: string): string | undefined => {
    if (typeof headers === 'object' && headers !== null && 'get' in headers && typeof headers.get === 'function') {
      return headers.get(name) ?? undefined;
    }
    const record = headers as Record<string, string | undefined>;
    const key = Object.keys(record).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? record[key] : undefined;
  };

  const retryAfter = getHeader('retry-after')?.trim();
  const resetHeader = getHeader('x-ratelimit-reset')?.trim() || getHeader('ratelimit-reset')?.trim();

  let targetDelayMs: number | null = null;

  // 1. Retry-After ヘッダーの解析
  if (retryAfter) {
    if (/^\d+$/.test(retryAfter)) {
      const num = Number(retryAfter);

      if (retryAfter.length >= 13) {
        // 13桁以上: UNIXミリ秒（Apple App Store Server API 等）
        targetDelayMs = Math.max(0, num - now);
      } else if (retryAfter.length === 10 && num > 1000000000) {
        // 10桁: UNIX秒
        targetDelayMs = Math.max(0, num * 1000 - now);
      } else {
        // 通常の秒数（RFC 9110 delay-seconds）
        targetDelayMs = num * 1000;
      }
    } else {
      // HTTP-date 形式（RFC 9110 / RFC 5322）
      const parsedDate = Date.parse(retryAfter);
      if (!isNaN(parsedDate)) {
        targetDelayMs = Math.max(0, parsedDate - now);
      }
    }
  }

  // 2. X-RateLimit-Reset / RateLimit-Reset ヘッダーのフォールバック
  if (targetDelayMs === null && resetHeader && /^\d+$/.test(resetHeader)) {
    const resetNum = Number(resetHeader);
    if (resetHeader.length >= 13) {
      targetDelayMs = Math.max(0, resetNum - now);
    } else if (resetHeader.length === 10 && resetNum > 1000000000) {
      targetDelayMs = Math.max(0, resetNum * 1000 - now);
    } else {
      targetDelayMs = resetNum * 1000;
    }
  }

  // 3. パース不能・ヘッダー未提供時はデフォルト待機時間
  if (targetDelayMs === null || isNaN(targetDelayMs)) {
    targetDelayMs = defaultDelayMs;
  }

  // 4. 異常値や極端に長い待機を防ぐための上限キャップ
  return Math.min(targetDelayMs, maxDelayMs);
}
```

---

## 5. 指数バックオフとジッター（Full Jitter）

待機時間が指定されていない場合や、複数クライアントが一斉に同一 API を叩く環境では、**指数バックオフ（Exponential Backoff）** に **ジッター（Jitter: ランダムな揺らぎ）** を加えることが推奨されます。

```typescript
/**
 * フルジッター付き指数バックオフ待機時間の計算
 * 
 * @param attempt 試行回数 (0, 1, 2...)
 * @param baseDelayMs 基本待機時間 (例: 1000ms)
 * @param maxDelayMs 最大待機時間 (例: 30000ms)
 */
export function calculateExponentialBackoffWithJitter(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000
): number {
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  // 0 〜 exponentialDelay の間でランダムな値を返す (Full Jitter)
  return Math.floor(Math.random() * (exponentialDelay + 1));
}
```

### なぜジッターが必要か？
もしジッターを付けずに全クライアントが `2^n 秒` の固定時間でリトライすると、リトライのタイミングが完全に同期してしまい、再度サーバーに過負荷がかかる **「リトライストーム（Thundering Herd 問題）」** を引き起こします。ジッターによってタイミングを分散させるのがベストプラクティスです。

---

## 6. 実装時のチェックリスト

1. **最大待機時間（上限キャップ）を必ず設ける**
   - サーバー側の不具合や誤設定で `Retry-After: 999999` のような極端な値が返ってきた際、プロセスが永久にハングするのを防ぎます。
2. **最大リトライ回数を制限する**
   - 通常は 3〜5 回程度で打ち切り、呼び出し元にエラーを返却するように設計します。
3. **クロックスキュー（時刻のズレ）を考慮する**
   - サーバーとクライアントでシステム時刻が数秒ズレている場合、計算結果が負数（過去の時刻）になることがあります。必ず `Math.max(0, ...)` でガードしましょう。

---

## 7. まとめ

- `Retry-After` は最新の **RFC 9110** で定義されていますが、現場では **UNIXミリ秒（Apple）** や **独自ヘッダー（`X-RateLimit-*`）** など多様なバリエーションが存在します。
- 桁数チェック（13桁以上ならミリ秒、10桁なら秒）を挟むことで、非標準 API にも自動対応できます。
- 待機時は **上限キャップ** と **ジッター付きバックオフ** を組み合わせることで、堅牢で安全なリトライ処理を実現できます。

外部 API 連携を実装する際は、ぜひ本記事のユーティリティや判定ロジックを活用してみてください。

---

### 参考リンク
- [RFC 9110 - HTTP Semantics (Section 10.2.3 Retry-After)](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3)
- [RFC 6585 - Additional HTTP Status Codes (Section 4 429 Too Many Requests)](https://www.rfc-editor.org/rfc/rfc6585.html#section-4)
- [Apple Developer - Identifying Rate Limits](https://developer.apple.com/documentation/appstoreserverapi/identifying-rate-limits)
- [AWS Architecture Blog - Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
