# 面接システム用 Dockerfile
# マルチステージビルド: フロントエンドとサーバーを統合

# ベースイメージ
FROM --platform=linux/amd64 node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 依存関係インストール
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# フロントエンドビルド
FROM base AS frontend-builder
COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build:client

# サーバーサイドビルド
FROM base AS server-builder
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build:server

# 本番実行環境
FROM --platform=linux/amd64 node:18-alpine AS runner
WORKDIR /app

# 必要なパッケージをインストール
RUN apk add --no-cache \
    dumb-init \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 interview

# 本番用依存関係をコピー
COPY --from=deps --chown=interview:nodejs /app/node_modules ./node_modules

# ビルド済みアプリケーションをコピー
COPY --from=frontend-builder --chown=interview:nodejs /app/dist ./dist
COPY --from=server-builder --chown=interview:nodejs /app/dist-server ./dist-server

# 設定ファイルをコピー
COPY --chown=interview:nodejs package.json ./

# 環境変数設定
ENV NODE_ENV=production
ENV PORT=8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# ユーザー切り替え
USER interview

# ポート公開
EXPOSE 8080

# アプリケーション起動
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist-server/server/index.js"] 