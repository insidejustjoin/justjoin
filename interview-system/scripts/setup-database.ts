/**
 * 面接システムデータベースセットアップスクリプト
 * Just Join Interview System Database Setup Script
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function setupDatabase() {
  console.log('🗄️  面接システムデータベースセットアップ開始...');

  // DATABASE_URL環境変数を確認
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ エラー: DATABASE_URL環境変数が設定されていません');
    console.error('環境変数を設定してください:');
    console.error('  export DATABASE_URL="postgresql://postgres:password@host:5432/database"');
    process.exit(1);
  }

  // スキーマファイルのパス（process.cwd()から相対パスで解決）
  const schemaFile = path.join(process.cwd(), 'database', 'schema.sql');
  
  if (!fs.existsSync(schemaFile)) {
    console.error(`❌ エラー: スキーマファイルが見つかりません: ${schemaFile}`);
    process.exit(1);
  }

  // スキーマファイルを読み込む
  const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
  console.log(`📄 スキーマファイルを読み込み: ${schemaFile}`);

  // データベース接続プールを作成
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // セットアップ時は1接続で十分
  });

  try {
    // 接続テスト
    console.log('🔌 データベースに接続中...');
    const client = await pool.connect();
    console.log('✅ データベース接続成功');

    try {
      // search_pathを設定
      await client.query('SET search_path = public');

      // スキーマSQLを実行（PostgreSQLでは複数コマンドを一度に実行可能）
      console.log('📝 スキーマを実行中...');
      
      // SQLファイルをパースしてコマンドを分割
      // $$で囲まれた関数定義やトリガー定義を考慮
      const lines = schemaSql.split('\n');
      let currentCommand = '';
      let inFunction = false;
      let inTrigger = false;
      let delimiter = '';

      const commands: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        
        // コメント行をスキップ
        if (trimmed.startsWith('--') || trimmed === '') {
          continue;
        }

        // 関数定義の開始を検出
        if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
          inFunction = true;
          delimiter = '$$';
        }

        // トリガー定義の検出
        if (trimmed.includes('CREATE TRIGGER')) {
          inTrigger = true;
        }

        currentCommand += line + '\n';

        // 関数定義の終了を検出
        if (inFunction && trimmed.includes('$$')) {
          if (trimmed.match(/\$\$/g)?.length === 2) {
            // $$が2つある場合は終了
            inFunction = false;
            commands.push(currentCommand.trim());
            currentCommand = '';
          } else if (trimmed.endsWith('$$') && !trimmed.startsWith('$$')) {
            inFunction = false;
            commands.push(currentCommand.trim());
            currentCommand = '';
          }
        } else if (!inFunction && trimmed.endsWith(';')) {
          // 通常のコマンドの終了
          if (currentCommand.trim()) {
            commands.push(currentCommand.trim());
            currentCommand = '';
          }
          inTrigger = false;
        }
      }

      // 残りのコマンドを追加
      if (currentCommand.trim()) {
        commands.push(currentCommand.trim());
      }

      let successCount = 0;
      let errorCount = 0;

      for (const command of commands) {
        if (!command || command.length < 10) {
          continue;
        }

        try {
          await client.query(command);
          successCount++;

          // 作成されたオブジェクトをログに出力
          const tableMatch = command.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
          if (tableMatch) {
            console.log(`  ✅ テーブル: ${tableMatch[1]}`);
          }

          const indexMatch = command.match(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?(\w+)/i);
          if (indexMatch) {
            console.log(`  ✅ インデックス: ${indexMatch[1]}`);
          }

          const triggerMatch = command.match(/CREATE TRIGGER (\w+)/i);
          if (triggerMatch) {
            console.log(`  ✅ トリガー: ${triggerMatch[1]}`);
          }

          if (command.includes('CREATE OR REPLACE FUNCTION')) {
            const funcMatch = command.match(/FUNCTION (\w+)/i);
            if (funcMatch) {
              console.log(`  ✅ 関数: ${funcMatch[1]}`);
            }
          }

          if (command.includes('CREATE OR REPLACE VIEW')) {
            const viewMatch = command.match(/VIEW (\w+)/i);
            if (viewMatch) {
              console.log(`  ✅ ビュー: ${viewMatch[1]}`);
            }
          }
        } catch (error: any) {
          // 既に存在する場合は警告のみ
          if (error.code === '42P07' || error.code === '42710' || error.message?.includes('already exists')) {
            console.log(`  ⚠️  既に存在します: ${command.substring(0, 60)}...`);
          } else {
            console.error(`  ❌ エラー (${error.code}): ${error.message}`);
            console.error(`  コマンド: ${command.substring(0, 100)}...`);
            errorCount++;
          }
        }
      }

      console.log(`\n📊 実行結果: 成功 ${successCount}件, エラー ${errorCount}件`);

      // テーブル一覧を確認
      console.log('\n📋 作成されたテーブル一覧:');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'interview_%'
        ORDER BY table_name
      `);
      
      if (tablesResult.rows.length > 0) {
        tablesResult.rows.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        console.log('  ⚠️  テーブルが見つかりませんでした');
      }

      console.log('\n✅ データベースセットアップ完了！');

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ データベース接続エラー:', error.message);
    if (error.code) {
      console.error(`   エラーコード: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// スクリプト実行
setupDatabase().catch(error => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});

