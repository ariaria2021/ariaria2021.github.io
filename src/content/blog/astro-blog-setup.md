---
title: "Astroでブログを作ってみた"
description: "GitHub Pagesで個人サイトを構築した技術的なメモ。Astroの使い方とContent Collectionsについて。"
date: 2026-02-04
tags: ["Astro", "技術メモ", "チュートリアル"]
---

## なぜAstroを選んだか

個人サイトを作るにあたって、いくつかの選択肢がありました：

- **Next.js** - フルスタックだけどブログには重い
- **Hugo** - 高速だけどテンプレート言語が独特
- **Astro** - 静的サイトに最適化、Reactも使える ✨

Astroは「島（Islands）アーキテクチャ」を採用していて、必要な部分だけインタラクティブにできます。ブログのような静的コンテンツ中心のサイトにはピッタリ。

## Content Collectionsが便利

Astroの **Content Collections** を使うと、Markdownファイルに型安全なスキーマを定義できます：

```typescript
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});
```

これにより、フロントマターの入力ミスをビルド時に検出できます。

## GitHub Actionsで自動デプロイ

`main`ブランチにプッシュするだけで自動的にビルド＆デプロイされます。設定は `.github/workflows/deploy.yml` に数十行書くだけ。

## まとめ

- Astroは静的サイトに最適
- Content Collectionsで型安全なコンテンツ管理
- GitHub Pagesとの相性も抜群

次は何を書こうかな 🤔
