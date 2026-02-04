---
title: "GitHub Pagesのデプロイエラー解決法"
description: "'pages build and deployment'が失敗する問題の対処法。Jekyllビルドを無効化してカスタムワークフローを優先させる設定。"
date: 2026-02-04
tags: ["GitHub Actions", "トラブルシューティング", "Astro"]
---

## 問題発生

Astroでサイトを作ってGitHubにプッシュした後、GitHub Actionsで2つのワークフローが走っていることに気づきました：

1. `Deploy to GitHub Pages` (自分で作ったやつ) → ✅ 成功
2. `pages build and deployment` (GitHubが勝手にやるやつ) → ❌ 失敗

後者のエラーログを見ると、AstroプロジェクトなのにJekyllとしてビルドしようとして失敗していました。

## 原因

GitHub Pagesはデフォルトで、リポジトリをJekyllサイトとしてビルドしようとします。しかし、今回はAstroを使っているため、このデフォルトの挙動が邪魔をしていました。

## 解決策

GitHub CLIを使って、Pagesのビルドタイプを `workflow` に変更します。

```bash
gh api repos/USERNAME/REPO_NAME/pages -X PUT -F build_type=workflow
```

これでGitHubは「あ、このリポジトリは独自のActionsワークフローでデプロイするんだな」と理解し、勝手にJekyllビルドを走らせなくなります。

設定画面（Settings > Pages > Build and deployment）からも変更可能です。Sourceを「GitHub Actions」に変更するだけです。
