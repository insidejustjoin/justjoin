#!/bin/bash

# データベースバックアップ作成スクリプト
# 使用方法: ./backup-database.sh

echo "🗄️  データベースバックアップを作成します..."

# 現在のVPSサーバー情報
VPS_HOST="162.43.28.210"
VPS_USER="root"
VPS_PASSWORD="R8z!pT@3wq"

echo "📋 バックアップ設定:"
echo "  VPSサーバー: $VPS_HOST"
echo "  ユーザー: $VPS_USER"

echo ""
echo "🔧 データベースバックアップ手順:"
echo ""
echo "1. VPSサーバーにSSH接続:"
echo "   ssh $VPS_USER@$VPS_HOST"
echo ""
echo "2. データベースのバックアップを作成:"
echo "   pg_dump -h localhost -U postgres -d match_job_db > /tmp/database-backup.sql"
echo ""
echo "3. バックアップファイルをローカルにダウンロード:"
echo "   scp $VPS_USER@$VPS_HOST:/tmp/database-backup.sql ./database-backup.sql"
echo ""

# 自動バックアップの実行
echo "🚀 自動バックアップを実行しますか？ (y/n): "
read -p "" AUTO_BACKUP

if [ "$AUTO_BACKUP" = "y" ] || [ "$AUTO_BACKUP" = "Y" ]; then
    echo ""
    echo "📦 VPSサーバーでバックアップを作成中..."
    
    # VPSサーバーでバックアップを作成
    sshpass -p "$VPS_PASSWORD" ssh $VPS_USER@$VPS_HOST '
        echo "データベースバックアップを作成中..."
        pg_dump -h localhost -U postgres -d match_job_db > /tmp/database-backup.sql
        if [ $? -eq 0 ]; then
            echo "✅ バックアップ作成完了"
            ls -la /tmp/database-backup.sql
        else
            echo "❌ バックアップ作成に失敗しました"
            exit 1
        fi
    '
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "📥 バックアップファイルをダウンロード中..."
        sshpass -p "$VPS_PASSWORD" scp $VPS_USER@$VPS_HOST:/tmp/database-backup.sql ./database-backup.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ バックアップファイルのダウンロード完了"
            echo "📁 ファイル: ./database-backup.sql"
            ls -la ./database-backup.sql
        else
            echo "❌ バックアップファイルのダウンロードに失敗しました"
        fi
    fi
else
    echo ""
    echo "⚠️  手動でバックアップを作成してください"
    echo "上記の手順に従ってバックアップを作成し、"
    echo "database-backup.sqlファイルをプロジェクトルートに配置してください"
fi

echo ""
echo "📋 バックアップ情報:"
echo "  ファイル名: database-backup.sql"
echo "  配置場所: ./database-backup.sql"
echo ""
echo "⚠️  注意事項:"
echo "1. バックアップファイルには機密情報が含まれています"
echo "2. ファイルを安全に管理してください"
echo "3. Gitにコミットしないでください"
echo ""
echo "🚀 次のステップ:"
echo "1. バックアップファイルの確認"
echo "2. ./check-setup.shを実行して設定を確認" 