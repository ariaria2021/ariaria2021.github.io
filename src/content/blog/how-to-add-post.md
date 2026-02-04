---
title: "ブログ記事の追加方法"
description: "このブログに新しい記事を追加する手順。Markdownファイルを作成してプッシュするだけでOK！"
date: 2026-02-04
tags: ["ガイド", "Astro"]
---

## 3ステップで公開

このブログはAstroとGitHub Pagesで動いているので、記事の追加はとてもシンプルです。

### 1. Markdownファイルを作成

`src/content/blog/` フォルダの中に、新しい `.md` ファイルを作ります。ファイル名がURLの一部になります（例: `my-new-post.md` → `/blog/my-new-post`）。

### 2. フロントマターを書く

ファイルの先頭に、記事の情報を書きます。

```markdown
---
title: "記事のタイトル"
description: "記事の短い説明"
date: 2026-02-04
tags: ["タグ1", "タグ2"]
---
```

これらは必須項目です。`tags` は省略可能です。

### 3. 本文を書いてプッシュ

あとはMarkdownで本文を書くだけ！

```markdown
## 見出し

普通に **太字** やリストも使えます。

- リスト1
- リスト2
```

書き終わったら、Gitでプッシュします。

```bash
git add .
git commit -m "Add new post"
git push
```

これだけで、数分後には自動的にサイトに公開されます 🎉
