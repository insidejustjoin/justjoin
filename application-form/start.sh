#!/bin/bash

# Cloud SQL Proxyを起動
echo "Starting Cloud SQL Proxy..."
cloud_sql_proxy -instances=justjoin-platform:asia-northeast1:justjoin-enterprise=tcp:5432 &

# プロキシの起動を待つ
sleep 10

# アプリケーションを起動
echo "Starting application..."
node dist-server/server/index.js 