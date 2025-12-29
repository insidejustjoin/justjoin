/**
 * 不要になったHubSpotプロパティの削除スクリプト
 *
 * このスクリプトを実行すると、不要になったプロパティが削除されます。
 *
 * 使用方法:
 *   HUBSPOT_API_KEY=your_api_key node -r ts-node/register src/integrations/hubspot/delete-old-properties.ts
 */
const OLD_PROPERTIES_TO_DELETE = [
    'japanese_level', // current_japanese_qualificationに置き換えられた
];
/**
 * 不要になったHubSpotプロパティを削除
 */
async function deleteOldProperties() {
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) {
        console.error('❌ HUBSPOT_API_KEY が設定されていません。');
        process.exit(1);
    }
    console.log('🗑️  不要になったHubSpotプロパティの削除を開始します...');
    console.log(`📋 削除するプロパティ数: ${OLD_PROPERTIES_TO_DELETE.length}`);
    console.log(`📋 削除対象: ${OLD_PROPERTIES_TO_DELETE.join(', ')}`);
    const results = [];
    for (const propName of OLD_PROPERTIES_TO_DELETE) {
        try {
            const response = await fetch(`https://api.hubapi.com/crm/v3/properties/contacts/${propName}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            if (response.ok) {
                console.log(`✅ ${propName}: 削除しました`);
                results.push({ name: propName, success: true });
            }
            else if (response.status === 404) {
                console.log(`⏭️  ${propName}: 既に削除されています`);
                results.push({ name: propName, success: true, skipped: true });
            }
            else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || JSON.stringify(errorData);
                console.error(`❌ ${propName}: 削除エラー (${response.status}) - ${errorMessage}`);
                results.push({ name: propName, success: false, error: errorMessage });
            }
        }
        catch (error) {
            console.error(`❌ ${propName}: 削除エラー - ${error.message}`);
            results.push({ name: propName, success: false, error: error.message });
        }
        // レート制限を避けるため、少し待機
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log(`\n📈 削除結果サマリー:`);
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    console.log(`   ✅ 削除成功: ${successCount}`);
    console.log(`   ❌ エラー: ${errorCount}`);
    if (errorCount > 0) {
        console.warn('\n⚠️  一部のプロパティの削除に失敗しました。');
        console.warn('   注意: HubSpotのデフォルトプロパティや、他の場所で使用されているプロパティは削除できません。');
    }
    else {
        console.log('\n✨ すべての不要プロパティの削除が完了しました！');
    }
}
// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
    deleteOldProperties()
        .then(() => {
        console.log('\n🎉 削除完了');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n💥 削除エラー:', error);
        process.exit(1);
    });
}
export { deleteOldProperties };
