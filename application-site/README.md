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
