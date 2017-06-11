# ChangeLog

## 2017/06/11 v0.8.2
* svg: IE/EdgeでSVG text with textLength and textAlign=center, right指定時の描画位置がおかしい件のWorkAroundを追加

## 2017/04/21 v0.8.1
* canvas: Opera 12でcanvasのfillText呼び出しがエラーする不具合の修正

## 2017/03/20 v0.8.0
* mocknode: Candleメンバ変数のCandle.document, XMLSerializer, DOMParserを出力するよう変更
* svg: XMLSerializerにmocknodeのものを使用するよう修正 (node.js環境エラー回避)

## 2017/03/03 v0.8.0-beta
* svg, canvas: fillTextの第4引数であるmaxLengthに対応

## 2016/03/06 v0.7.0
* mocknode: node.js環境でグローバル名前空間に影響が出ないようにします
* core: Electron環境でもブラウザ環境と同様に動作するよう修正します

## 2016/02/27 v0.6.1
* core: addWrapperとaddType関数を統合します
* canvas: ブラウザもnode-canvasもない環境でcanvasが有効と誤判定してしまう問題を修正

## 2016/02/23 v0.6.0
* svg, canvas: layer自体の参照を持つようにしてidを設定しないようにします
* canvas: Layer関連のオブジェクトをcanvas下に移動
* core, base: 要素にcandleEnableプロパティを設定しないようにします
* mocknode: nodeNameプロパティ追加、attributeのserialize修正とquerySelectorの修正

## 2016/02/21 v0.5.0
* node.js環境でもnode-canvasがglobalにインストールされている時canvas描画ができるよう修正
* node.js環境下でjsdomを使用せずにSVG出力できるようにSVGの解析ルーチンを作成します
* Canvas.startで初期化済みの時に返すオブジェクトを修正
* canvas.toBufferを追加
* toDataURL, toBlobにquality argumentを追加
* toBlob関数でblobを返さないように修正します
* svgで不要なCSSのz-indexを使用しないようにします

## 2016/01/31 v0.4.0
* IE8以下向けのVML関連ルーチンを削除
* node.js環境下ではCandle.startを呼び出された時にまで初期化を待つよう修正
* Candle.startの第一引数はElementオブジェクトのみに変更
* canvas描画時にsetLineDashがないブラウザにおける点線描画のコンパチビリティ対策を削除
* onload時自動的にcandle要素をキャンバス化する処理を削除

## 2016/01/10 v0.3.2
* fillText時のテキスト描画速度を改善
* jsdomなどのnode.js環境で読み込まれた時にエラーにならないよう修正

## 2015/08/25 v0.3.1
* fillText時のテキスト描画位置を修正

## 2015/02/15 v0.3.0
* SVG, VMLでvidが指定されている時に描画パスや色のみを変更するようにします
* Candle.parsecolorrev() APIを削除

## 2014/09/21 v0.2.7
* canvasのsetLinedashメソッドを実装していないブラウザにおいて縦の点線が表示できない不具合を修正

## 2014/09/15 v0.2.6
* VMLのfillTextでelementsオブジェクトにキャッシュするエレメントを修正
* SVGのテキスト書き換えをreplaceNodeでなくtextContentで行うよう修正
* SVGの画像描画をdefs要素にあるuse/symbol要素で描画するように変更
* Candle.start関数の第一引数をエレメントでも受け付けるように修正
* fillRectCenter関数を追加
* textBaseLineの指定をSVGとcanvasで同じになるよう修正

## 2014/03/23 v0.2.5
* Safari 3.2でcanvas wrapper部がエラーとなってしまうのを修正

## 2014/03/16 v0.2.4
* Silverlight描画ルーチンを削除
* VMLではCSSのdisplay, positionプロパティを設定するように修正

## 2014/03/09 v0.2.3
* 盤面の初期化時にCSSのdisplay, positionプロパティを設定しないように修正

## 2014/03/03 v0.2.2
* SVG描画時のfont指定で、sans-serifを指定した時に指定通りにならないことがある不具合を修正

## 2014/03/02 v0.2.1
* SVG描画時のtoDataURL(), toBlob()を追加
* SVG描画時の要素に対するfont指定方法を変更
* SVG描画時のtextBaseline = hanging, middle指定時における描画位置を少し上に修正

## 2014/01/06 v0.2.0
* toBlob(), strokeDashedLine()関数を追加
* 結合ファイルの作成にGruntを使用するようにした
* crispEdgeの設定方法を変更
* その他リファクタリングを行った

## 2013/03/11 v0.1.0
* グラフ描画用スクリプトを別リポジトリに分離
* 描画方法別にソースファイルを分割
* drawImage()関数を追加
* その他のbug fixを行った

## 2010/02/26 v0.0.0
* First Release
