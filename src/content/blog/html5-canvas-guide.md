---
title: "HTMLは知ってるけどCanvas APIって何？ ── タワーディフェンスの実装を例に学ぶHTML5 Canvas入門"
description: "HTMLの基礎知識がある方に向けて、HTML5で追加されたCanvas APIの基本をゼロから解説します。実際のゲーム（canvas-tower-defense）のソースコードを使って、図形描画・パス・座標変換・アニメーションの仕組みを具体的に学べます。"
date: 2026-02-11
tags: ["HTML5", "Canvas", "TypeScript", "Tutorial", "GameDev"]
---

## はじめに：HTMLとHTML5の違い

「HTMLはなんとなく書ける」という方は多いと思います。`<div>`, `<p>`, `<img>` などのタグを使ってWebページを組み立てる——これが従来のHTMLの世界です。

**HTML5** はその進化版で、2014年に正式な仕様として勧告されました。大きな違いは、**ブラウザだけでリッチなコンテンツを作れる仕組み**が大量に追加されたことです。その代表格が今回紹介する **`<canvas>` 要素** です。

| 従来のHTML | HTML5で追加された要素 |
|---|---|
| テキスト・画像の配置 | `<canvas>` — 自由な2D/3D描画 |
| フォーム入力 | `<video>`, `<audio>` — メディア再生 |
| テーブルレイアウト | `<article>`, `<section>` — セマンティックな構造化 |

> [!NOTE]
> この記事では、実際に私が作成した[タワーディフェンスゲーム](https://ariaria2021.github.io/canvas-tower-defense/)のソースコードを引用しながら解説します。「教科書の例」ではなく「動いている本物のコード」で学べるのがポイントです。

## 1. `<canvas>` とは — 「白紙のスケッチブック」

`<canvas>` は、JavaScriptからピクセル単位で絵を描くための要素です。HTMLに1行書くだけで、描画可能な領域が出現します。

```html
<!-- canvas-tower-defense の index.html より -->
<canvas id="gameCanvas"></canvas>
```

ただしこれだけでは何も表示されません。**描画はすべてJavaScriptで行います。** まずは「ペン」に相当する **描画コンテキスト** を取得するところから始まります。

```typescript
// canvas-tower-defense: Game.ts のコンストラクタより
this.canvas = canvas;
this.ctx = canvas.getContext('2d')!;
```

`getContext('2d')` で取得する `CanvasRenderingContext2D` が、描画に使うすべてのメソッドを持っています。線を引く、円を描く、色を変える——すべてこの `ctx` を通じて行います。

## 2. 基本の描画 — 四角形と色

最もシンプルな描画は `fillRect()` です。canvas-tower-defense では、毎フレーム画面全体を塗りつぶしてからゲームを描画しています。

```typescript
// canvas-tower-defense: Game.ts の draw() より
// 画面全体をクリーム色で塗りつぶし（=画面クリア）
this.ctx.fillStyle = '#FFF9E5';
this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
```

- `fillStyle` — 塗りの色を指定する（CSS色文字列やグラデーションが使える）
- `fillRect(x, y, width, height)` — 指定した座標に塗りつぶした四角形を描画する

タワー（砲台）の描画もこの `fillRect` だけで実現しています。

```typescript
// canvas-tower-defense: Tower.ts の draw() より
// 外枠の四角形（タワー本体）
ctx.fillStyle = this.color;          // '#4F86C6'（ソフトブルー）
ctx.fillRect(this.x - 18, this.y - 18, 36, 36);

// 内側の四角形（砲口のイメージ）
ctx.fillStyle = '#3A6BA5';
ctx.fillRect(this.x - 6, this.y - 6, 12, 12);
```

四角形を2つ重ねるだけで「タワー」に見えるのがCanvasの面白いところです。

## 3. パスと線 — 道を描く

四角形以外の図形は **パス（Path）** という仕組みを使います。「ペンを紙に置いて（moveTo）、線を引いて（lineTo）、最後にインクを乗せる（stroke / fill）」というイメージです。

canvas-tower-defense の「敵が通る道」は、まさにこのパスで描かれています。

```typescript
// canvas-tower-defense: Map.ts の draw() より
ctx.strokeStyle = '#E6DDC3';  // 線の色
ctx.lineWidth = 44;           // 線の太さ（ピクセル）
ctx.lineCap = 'round';        // 線の端を丸くする
ctx.lineJoin = 'round';       // 線の曲がり角を丸くする

ctx.beginPath();               // パスの開始
ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);  // スタート地点にペンを置く
for (let i = 1; i < this.waypoints.length; i++) {
    ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);  // 次の地点まで線を引く
}
ctx.stroke();                  // 実際に線を画面に描画する
```

**ここがポイント：**
- `beginPath()` を呼ばないと、前に描いたパスと混ざってしまいます
- `stroke()` は「線を描く」、`fill()` は「囲まれた領域を塗りつぶす」
- `lineCap` や `lineJoin` で線の見た目を細かく調整できます

## 4. 円と弧 — 敵・弾・マーカー

円の描画には `arc()` を使います。敵キャラクター、弾丸、スタート/ゴールのマーカー——このゲームの円形要素はすべて `arc()` です。

```typescript
// canvas-tower-defense: Enemy.ts の draw() より
ctx.fillStyle = this.color;   // 敵の色（赤: '#D64545'、タンク型は青など）
ctx.beginPath();
ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);  // 完全な円
ctx.fill();
```

`arc()` のパラメータは `arc(中心x, 中心y, 半径, 開始角度, 終了角度)` です。`0` から `Math.PI * 2`（360度）まで描けば完全な円になります。半円にしたい場合は `Math.PI` までにします。

> [!TIP]
> 公式リファレンスでは、円弧の描き方や反時計回りの指定など、より詳細なパラメータが解説されています。→ [MDN: CanvasRenderingContext2D.arc()](https://developer.mozilla.org/ja/docs/Web/API/CanvasRenderingContext2D/arc)

## 5. 座標変換 — `save()` / `scale()` / `restore()`

canvas-tower-defense はスマートフォンとPCの両方で動作します。画面サイズが違っても同じ見た目になるように、**仮想座標系**（論理的には800px幅）をスケーリングして実際の画面にマッピングしています。

```typescript
// canvas-tower-defense: Game.ts の draw() より
this.ctx.save();                           // 現在の描画状態を保存
this.ctx.scale(this.scale, this.scale);    // 仮想座標 → 実画面にスケーリング

// ここで描画するものは全てスケーリングされる
this.ctx.fillStyle = '#FFF9E5';
this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
this.drawGrid();
this.map.draw(this.ctx);
this.entities.forEach(entity => entity.draw(this.ctx));

this.ctx.restore();                        // 保存した状態に戻す
```

- `save()` — 現在の変換行列・スタイル設定を「履歴」に積む
- `scale(sx, sy)` — 以降の描画をすべて拡大/縮小する
- `restore()` — `save()` 時点の状態に戻す

この **save → 変換 → 描画 → restore** のパターンは、Canvas開発で非常によく使われるイディオムです。

> [!IMPORTANT]
> `restore()` を忘れると、以降のすべての描画がスケーリングされたままになります。必ずペアで使いましょう。

## 6. エフェクト — 影で光らせる

弾丸（Projectile）は `shadowBlur` を使って発光エフェクトを実現しています。

```typescript
// canvas-tower-defense: Projectile.ts の draw() より
ctx.fillStyle = this.color;       // '#FBBF24'（ゴールド）
ctx.beginPath();
ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
ctx.shadowBlur = 5;               // ぼかしの強さ
ctx.shadowColor = this.color;     // 影の色（=本体と同じ色 → 発光に見える）
ctx.fill();
ctx.shadowBlur = 0;               // 影をリセット（他の描画に影響させない）
```

`shadowBlur` を本体と同じ色に設定すると、まるで光っているように見えます。たった2行追加するだけでゲームの見栄えが大きく変わる、コスパの良いテクニックです。

## 7. アニメーション — `requestAnimationFrame`

Canvasにはアニメーション機能が組み込まれていません。**毎フレーム、画面を全消去して描き直す** ことでアニメーションを実現します。

```typescript
// canvas-tower-defense: Game.ts より
start() {
    this.lastTime = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
}

loop(timestamp: number) {
    if (this.isGameOver || this.isPaused) return;

    const dt = (timestamp - this.lastTime) / 1000;  // 経過時間（秒）
    this.lastTime = timestamp;

    this.update(dt);   // ゲームの状態を更新
    this.draw();       // 画面を全部描き直す

    requestAnimationFrame((ts) => this.loop(ts));    // 次のフレームを予約
}
```

`requestAnimationFrame` はブラウザが「次の描画タイミング」で指定した関数を呼び出してくれるAPIです。通常は毎秒60回（60fps）実行されます。

**`setInterval` との違い：**

| 方法 | 特徴 |
|---|---|
| `setInterval(fn, 16)` | 他のタブに切り替えても動き続ける。タイミングが不正確。 |
| `requestAnimationFrame(fn)` | タブが非表示になると自動停止。ブラウザの描画と同期して効率的。 |

> [!TIP]
> `dt`（デルタタイム）を使って移動量を計算することで、フレームレートが変わっても一定速度で動くようにしています。これは **フレームレート非依存** と呼ばれるゲーム開発の基本テクニックです。

## 8. グリッド描画 — forループで規則的なパターン

タワーを配置するためのグリッド線も、シンプルなループで描画しています。

```typescript
// canvas-tower-defense: Game.ts の drawGrid() より
drawGrid() {
    const gridSize = 40;
    this.ctx.strokeStyle = '#E0D8C0';
    this.ctx.lineWidth = 1;

    // 縦線
    for (let x = 0; x <= this.logicalWidth; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.logicalHeight);
        this.ctx.stroke();
    }

    // 横線
    for (let y = 0; y <= this.logicalHeight; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.logicalWidth, y);
        this.ctx.stroke();
    }
}
```

ループの中で `beginPath → moveTo → lineTo → stroke` を繰り返すだけで、画面一面にグリッドが出来上がります。

## 9. マウス入力 — クリック座標の取得

ユーザーのクリック位置にタワーを配置する処理では、Canvas上の座標を計算する必要があります。

```typescript
// canvas-tower-defense: Game.ts の handleClick() より
handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();

    // クリック位置をCanvas内の仮想座標に変換
    const x = (e.clientX - rect.left) / this.scale;
    const y = (e.clientY - rect.top) / this.scale;

    // グリッドにスナップ（40px単位の中央に配置）
    const gridSize = 40;
    const snappedX = Math.floor(x / gridSize) * gridSize + gridSize / 2;
    const snappedY = Math.floor(y / gridSize) * gridSize + gridSize / 2;
    // ...
}
```

`e.clientX` はウィンドウ全体のマウス位置なので、Canvasの左上からの相対位置に変換するために `getBoundingClientRect()` を使っています。さらに仮想座標系を採用しているため、`scale` で割って論理座標に戻しています。

## まとめ

Canvas APIの基本をまとめると：

| やりたいこと | 使うメソッド | ゲーム内の実例 |
|---|---|---|
| 四角形を描く | `fillRect()`, `strokeRect()` | タワー、背景、HPバー |
| 円を描く | `arc()` + `fill()` | 敵、弾丸、マーカー |
| 線を描く | `moveTo()` + `lineTo()` + `stroke()` | 道、グリッド |
| 拡大/縮小 | `save()` + `scale()` + `restore()` | レスポンシブ対応 |
| アニメーション | `requestAnimationFrame()` | ゲームループ |
| エフェクト | `shadowBlur` | 弾丸の発光 |

すべてプラグインやライブラリなしで実現できます。`<canvas>` は「自由に描ける白紙」であり、**想像力がそのままアウトプットになる**——それがこのAPIの最大の魅力です。

👉 [タワーディフェンスを遊んでみる](https://ariaria2021.github.io/canvas-tower-defense/)
👉 [ソースコード全文を見る (GitHub)](https://github.com/ariaria2021/canvas-tower-defense)

## 参考文献

- [MDN Web Docs: Canvas API](https://developer.mozilla.org/ja/docs/Web/API/Canvas_API) — Canvas APIの公式リファレンス
- [MDN Web Docs: Canvas チュートリアル](https://developer.mozilla.org/ja/docs/Web/API/Canvas_API/Tutorial) — ステップバイステップの入門チュートリアル
- [MDN Web Docs: CanvasRenderingContext2D](https://developer.mozilla.org/ja/docs/Web/API/CanvasRenderingContext2D) — 描画コンテキストの全メソッド一覧
- [MDN Web Docs: window.requestAnimationFrame()](https://developer.mozilla.org/ja/docs/Web/API/Window/requestAnimationFrame) — アニメーションループの公式解説
- [HTML Living Standard: The canvas element](https://html.spec.whatwg.org/multipage/canvas.html) — WHATWGによるHTML仕様書
