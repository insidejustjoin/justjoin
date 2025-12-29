/**
 * HubSpotカスタムプロパティの削除スクリプト
 *
 * このスクリプトを実行すると、以前作成したカスタムプロパティが削除されます。
 */
import { HubSpotClient } from './client.js';
import { HUBSPOT_CUSTOM_PROPERTIES } from './mapper.js';
/**
 * HubSpotカスタムプロパティを削除
 */
async function deleteHubSpotProperties() {
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) {
        console.error('❌ HUBSPOT_API_KEY が設定されていません。');
        process.exit(1);
    }
    const hubspotClient = new HubSpotClient(apiKey);
    console.log('🗑️  HubSpotカスタムプロパティの削除を開始します...');
    console.log(`📋 削除するプロパティ数: ${HUBSPOT_CUSTOM_PROPERTIES.length}`);
    const results = [];
    for (const prop of HUBSPOT_CUSTOM_PROPERTIES) {
        try {
            const response = await fetch(`https://api.hubapi.com/crm/v3/properties/contacts/${prop.name}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            if (response.ok || response.status === 404) {
                console.log(`✅ ${prop.name}: 削除しました`);
                results.push({ name: prop.name, success: true });
            }
            else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ ${prop.name}: 削除エラー - ${JSON.stringify(errorData)}`);
                results.push({ name: prop.name, success: false, error: JSON.stringify(errorData) });
            }
        }
        catch (error) {
            console.error(`❌ ${prop.name}: 削除エラー - ${error.message}`);
            results.push({ name: prop.name, success: false, error: error.message });
        }
        // レート制限を避けるため、少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`\n📈 削除結果サマリー:`);
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    console.log(`   ✅ 削除成功: ${successCount}`);
    console.log(`   ❌ エラー: ${errorCount}`);
    if (errorCount > 0) {
        console.warn('\n⚠️  一部のプロパティの削除に失敗しました。');
    }
    else {
        console.log('\n✨ すべてのプロパティの削除が完了しました！');
    }
}
// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
    deleteHubSpotProperties()
        .then(() => {
        console.log('\n🎉 削除完了');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n💥 削除エラー:', error);
        process.exit(1);
    });
}
