---
title: "Codexで複数リポジトリのNode.jsバージョンとブランチを棚卸しした"
description: "ローカルとCIのNode.jsバージョンのずれをきっかけに、GitHub Actions、既定ブランチ、GitHub Pages設定を複数リポジトリで確認・更新した記録です。"
date: 2026-09-09
tags: ["Codex", "GitHub Actions", "GitHub Pages", "Node.js", "保守"]
draft: false
---

複数のGitHubリポジトリをまとめてメンテナンスしたときの記録です。Codexと`gh` CLIで状態を確認し、Node.jsのバージョン、既定ブランチ、GitHub Pagesの設定を順にそろえました。

## はじめに

リポジトリの`.tool-versions`と、ローカルのasdfに入っているNode.jsのバージョンがずれていました。

あるリポジトリの`.tool-versions`は`24.13.0`を指定しているのに、ローカルには`24.15.0`しか入っていない状態でした。最初にしたのは、asdfで`24.13.0`を追加することです。

そのあと、ほかのリポジトリのGitHub Actionsも確認しました。すると、Node.js `20`を指定しているワークフローが見つかりました。

Node.js 20は2026年3月24日にサポート終了になっています。[Node.jsのリリース一覧](https://nodejs.org/en/about/previous-releases)を確認して、これは`24`へ更新する対象だと判断しました。

さらに見ていくと、GitHub Actionsで指定しているNode.jsは`20`、`24`、`24.13.0`と混在していました。既定ブランチも`master`のリポジトリと`main`のリポジトリがありました。そこでCodexと`gh` CLIを使い、アカウント内のリポジトリをまとめて確認することにしました。

## GitHub Actionsとリポジトリ設定を確認した

リポジトリごとに、次の情報を集めました。

- 既定ブランチ
- `.github/workflows/deploy.yml`の有無
- `actions/setup-node`の`node-version`
- 最新のGitHub Actions実行結果
- GitHub Pagesを使っている場合は、Pages環境の設定

ここで、`node-version: "24"`と`node-version: "24.13.0"`は同じではないと分かりました。

```yaml
node-version: "24"
```

これはNode.js 24系を指定しています。一方で、次のように書くと実行するバージョンまで固定できます。

```yaml
node-version: "24.13.0"
```

今回そろえたかったのは「24系を使うこと」ではなく、ローカルとCIで確認しやすい状態にすることでした。そのため、Pagesをデプロイするワークフローは`24.13.0`に統一しました。

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: "24.13.0"
    cache: npm
```

変更後は、各リポジトリで`npm ci`と`npm run build`を実行し、push後にGitHub Actionsのbuildとdeployが成功するところまで確認しました。

## Node.jsを見ていたら、masterとmainも混在していた

Node.jsの指定と一緒に、既定ブランチも確認しました。

すでに`main`があり、`master`より先に進んでいるリポジトリでは、GitHubの既定ブランチを`main`へ変更しました。別のリポジトリでは`master`しかなかったため、`main`を作成してから既定ブランチを切り替えました。

ワークフローのトリガーも、既定ブランチに合わせて変更しました。

```yaml
on:
  push:
    branches: [main]
```

この変更を入れた直後、あるリポジトリではbuildが成功しているのにPagesのdeployだけが失敗しました。

```text
Branch "main" is not allowed to deploy to github-pages
```

調べると、GitHubの`github-pages`環境は`master`からのデプロイだけを許可していました。既定ブランチとワークフローを`main`に変えても、環境の許可ブランチは別の設定として残っていました。

そのため、環境の許可ルールも`main`に変更して、失敗した実行を再実行しました。今度はdeployまで成功しました。

## node_modulesが追跡されていたリポジトリ

棚卸しの途中で、とあるリポジトリには`node_modules`とビルド済みの`dist`がコミットされていることも分かりました。

このリポジトリにはPages用のワークフローを追加し、CIで`npm ci`と`npm run build`を実行して`dist`をアップロードする形にしました。Gitの追跡からは`node_modules`と`dist`を外し、`.gitignore`に追加しました。

```
node_modules/
dist/
```

Viteの生成物をGitHub PagesのプロジェクトURLで配信するため、ベースパスも設定しました。

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/unix-time-converter/',
});
```

ビルド後のHTMLを確認すると、アセットのURLは`/unix-time-converter/assets/...`になっていました。

## リモートに先にmainがあった

このリポジトリで`main`を作ってpushしようとすると、non-fast-forwardで拒否されました。ローカルにはなかった`main`が、リモートにはすでに存在していました。

リモートの`main`には、`node_modules`を追跡から外す変更やPages用ワークフロー、画面文言の変更が入っていました。ここではforce pushはせず、`git fetch`で取得して差分を確認しました。

リモートの変更を取り込むと、ワークフロー、`.gitignore`、Vite設定で競合しました。リモート側にあった設定は残し、Node.jsの指定だけを`24.13.0`にして解消しました。再度ビルドしてpushし、Pagesデプロイも成功しました。

## まとめ

作業のきっかけは、リポジトリの`.tool-versions`とローカルのasdfに入っているNode.jsが少しずれていたことでした。確認を広げると、GitHub ActionsでのNode.js指定方法、既定ブランチ、Pages環境の許可ルール、追跡されているファイルまで、リポジトリごとの差分が見つかりました。

最終的に、GitHub Pagesを運用しているリポジトリは`main`を既定ブランチにし、GitHub ActionsのNode.jsを`24.13.0`にそろえました。空のリポジトリは既定ブランチを持たないため、そのままにしています。

Codexには、リモートの状態確認、変更、ビルド、GitHub Actionsの結果確認を進めてもらいました。こちらで変更の範囲を決めながら進めると、複数リポジトリでも状態を追いやすく感じました。
