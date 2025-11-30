import { createNotificationHistoryTables } from '../src/integrations/postgres/notifications';

async function main() {
  try {
    console.log('通知履歴テーブルを作成中...');
    await createNotificationHistoryTables();
    console.log('通知履歴テーブルが正常に作成されました');
  } catch (error) {
    console.error('通知履歴テーブル作成エラー:', error);
    process.exit(1);
  }
}

main(); 