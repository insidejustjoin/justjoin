/**
 * HubSpotカスタムプロパティのセットアップスクリプト
 * 
 * このスクリプトを実行すると、必要なカスタムプロパティがHubSpotに作成されます。
 * 
 * 使用方法:
 *   node -r ts-node/register src/integrations/hubspot/setup.ts
 * 
 * または、サーバー起動時に自動実行する場合は、サーバーの初期化処理で呼び出してください。
 */

import { HubSpotClient } from './client.js';
import { HUBSPOT_CUSTOM_PROPERTIES } from './mapper.js';

/**
 * HubSpotカスタムプロパティをセットアップ
 */
export async function setupHubSpotProperties(): Promise<void> {
  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ HUBSPOT_API_KEY が設定されていません。プロパティのセットアップをスキップします。');
    return;
  }
  const hubspotClient = new HubSpotClient(apiKey);
  
  console.log('🚀 HubSpotカスタムプロパティのセットアップを開始します...');
  console.log(`📋 作成するプロパティ数: ${HUBSPOT_CUSTOM_PROPERTIES.length}`);
  
  const results = await hubspotClient.createCustomProperties(HUBSPOT_CUSTOM_PROPERTIES);
  
  console.log('\n📊 セットアップ結果:');
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const result of results) {
    if (result.success) {
      if (result.message.includes('既に存在')) {
        skipCount++;
        console.log(`⏭️  ${result.name}: ${result.message}`);
      } else {
        successCount++;
        console.log(`✅ ${result.name}: ${result.message}`);
      }
    } else {
      errorCount++;
      console.error(`❌ ${result.name}: ${result.message}`);
    }
  }
  
  console.log(`\n📈 結果サマリー:`);
  console.log(`   ✅ 作成成功: ${successCount}`);
  console.log(`   ⏭️  既存: ${skipCount}`);
  console.log(`   ❌ エラー: ${errorCount}`);
  
  if (errorCount > 0) {
    console.warn('\n⚠️  一部のプロパティの作成に失敗しました。エラーメッセージを確認してください。');
  } else {
    console.log('\n✨ すべてのプロパティのセットアップが完了しました！');
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  setupHubSpotProperties()
    .then(() => {
      console.log('\n🎉 セットアップ完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 セットアップエラー:', error);
      process.exit(1);
    });
}

