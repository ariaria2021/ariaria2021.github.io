---
title: "Tile Merge Game"
description: "2048インスパイアの数字マージパズルゲーム。ReactとTypeScriptで作成。"
date: 2026-02-04
tags: ["React", "TypeScript", "Game"]
github: "https://github.com/ariaria2021/tile-merge-game"
demo: "https://ariaria2021.github.io/tile-merge-game/"
image: ""
featured: true
---

## 概要

同じ数字のタイルをスライドさせて合体させ、より大きな数字を作っていくパズルゲームです。

## 機能

- **キーボード操作**: 矢印キーで軽快に操作
- **タッチ操作**: モバイル端末でのスワイプに対応
- **アニメーション**: 滑らかなタイル移動とマージエフェクト
- **レスポンシブ**: スマートフォンからデスクトップまで対応

## 技術詳細

Reactのカスタムフックを使用してゲームロジック（グリッドの状態管理、マージ判定）をUIから分離しています。
タイル移動のアニメーションにはCSS Transitionsを使用し、Reactのレンダリングサイクルと連携させています。
