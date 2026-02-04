---
title: "Canvas Tower Defense"
description: "Canvas APIを使用した超軽量タワーディフェンスゲーム。ライブラリを一切含まず、高速に動作します。"
date: 2026-02-05
tags: ["Astro", "TypeScript", "Canvas", "VanillaJS"]
github: "https://github.com/ariaria2021/canvas-tower-defense"
demo: "https://ariaria2021.github.io/canvas-tower-defense/"
featured: true
---

## 概要

幾何学的な図形のみで構成された、「シンプル・イズ・ベスト」を体現するタワーディフェンスゲームです。
フレームワークを通さないピュアなCanvas操作により、何百というエンティティが動いても非常にスムーズに動作します。

## 主な機能

- **ベクター移動**: ウェイポイントに基づいた滑らかな敵の移動
- **自動索敵**: 射程内の敵を検知し、一番近いターゲットを狙うAI
- **経済システム**: 敵を倒すことで資金を得、防衛網を強化
- **レスポンシブ**: 画面サイズに合わせてマップが自動で調整されます

## 技術スタック

- **TypeScript**: クラス設計による整理されたエンティティ管理
- **HTML5 Canvas API**: 低レイヤーな描画制御
- **GitHub Actions**: 高速な継続的デプロイ
