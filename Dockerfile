# GCP用の本番環境Express.jsサーバー
FROM node:18-alpine AS builder

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY bun.lockb ./

# 依存関係のインストール（開発依存関係も含む）
RUN npm ci

# アプリケーションファイルをコピー
COPY . .

# ビルド実行
RUN npm run build

# 本番環境用のイメージ
FROM node:18-alpine

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./
COPY bun.lockb ./

# 本番依存関係のみインストール
RUN npm ci --omit=dev

# ビルドされたファイルをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# ポート8080を公開（GCP Cloud Runの要件）
EXPOSE 8080

# ヘルスチェックの設定
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# 非rootユーザーで実行（セキュリティ向上）
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# アプリケーション起動
CMD ["node", "dist-server/server/index.js"]