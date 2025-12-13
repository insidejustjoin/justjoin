# application-site

justjoin.jpのランディングページ（静的サイト）

## 📋 概要

求職者と企業をつなぐ求人プラットフォーム「justjoin」のランディングページです。
React + Vite + Tailwind CSSで構築され、GCP Cloud Storage + Cloud CDNでホスティングされています。

## 🚀 開発

### セットアップ

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

## 🌐 デプロイ

GCP Cloud Storageへのデプロイ:

```bash
npm run deploy
```

または

```bash
./deploy-gcp.sh
```

## 📁 構成

- `src/components/` - Reactコンポーネント
- `src/contexts/` - 多言語対応コンテキスト
- `public/` - 静的ファイル（ロゴ、ファビコン）
- `dist/` - ビルド成果物

## 🎨 カラーパレット

- メイン: `#DA2222`
- サブメイン: `#B81C1C`
- アクセント: `#237ED9`
- サブアクセント: `#6BAEEA`
- テキスト: 黒（基本）

## 🌍 多言語対応

- 日本語 (ja)
- 英語 (en)
- ロシア語 (ru)
- ウズベク語 (uz)

## 📊 Google Analytics 4 (GA4)

全ページにGoogle Analytics 4が統合されています。

### 設定方法

1. GA4の測定ID（例: `G-XXXXXXXXXX`）を取得します
2. 環境変数を設定します：
   - 開発環境: `.env.local`ファイルに`VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`を追加
   - 本番環境: デプロイ前に環境変数として設定、またはビルド時に`VITE_GA4_MEASUREMENT_ID`をエクスポート

```bash
# 開発時
echo "VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX" > .env.local

# ビルド時（一時的に環境変数を設定）
export VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
npm run build
```

測定IDが設定されていない場合、GA4は無効化されます（エラーは発生しません）。
