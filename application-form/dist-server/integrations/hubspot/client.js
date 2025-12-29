/**
 * HubSpot API クライアント
 *
 * HubSpotのContacts APIを使用して求職者情報を連携します。
 * 環境変数 HUBSPOT_API_KEY が必要です。
 */
export class HubSpotClient {
    apiKey;
    baseUrl = 'https://api.hubapi.com';
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.HUBSPOT_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ HUBSPOT_API_KEY が設定されていません。HubSpot連携はスキップされます。');
        }
    }
    /**
     * 連絡先を作成または更新
     * メールアドレスで既存の連絡先を検索し、存在する場合は更新、存在しない場合は作成します。
     */
    async createOrUpdateContact(contact) {
        if (!this.apiKey) {
            console.error('[HubSpot] APIキーが設定されていません');
            return null;
        }
        try {
            console.log(`[HubSpot] 連絡先の作成/更新開始: email=${contact.email}`);
            // まずメールアドレスで既存の連絡先を検索
            console.log(`[HubSpot] 既存連絡先を検索中: email=${contact.email}`);
            const existingContact = await this.findContactByEmail(contact.email);
            if (existingContact) {
                console.log(`[HubSpot] 既存連絡先が見つかりました: contactId=${existingContact.id}`);
                // 既存の連絡先を更新
                console.log(`[HubSpot] 連絡先を更新中: contactId=${existingContact.id}`);
                const result = await this.updateContact(existingContact.id, contact);
                console.log(`[HubSpot] 連絡先更新成功: contactId=${existingContact.id}`);
                return result;
            }
            else {
                console.log(`[HubSpot] 既存連絡先が見つかりませんでした。新規作成します: email=${contact.email}`);
                // 新しい連絡先を作成
                const result = await this.createContact(contact);
                console.log(`[HubSpot] 連絡先作成成功: contactId=${result.id}`);
                return result;
            }
        }
        catch (error) {
            const errorMessage = error?.message || String(error);
            console.error('[HubSpot] 連絡先の作成/更新エラー:', {
                email: contact.email,
                error: errorMessage,
                stack: error?.stack
            });
            throw new Error(`HubSpot連絡先の作成/更新に失敗しました: ${errorMessage}`);
        }
    }
    /**
     * メールアドレスで連絡先を検索
     */
    async findContactByEmail(email) {
        try {
            console.log(`[HubSpot] 連絡先検索API呼び出し: email=${email}`);
            const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    filterGroups: [
                        {
                            filters: [
                                {
                                    propertyName: 'email',
                                    operator: 'EQ',
                                    value: email,
                                },
                            ],
                        },
                    ],
                    properties: ['id'],
                    limit: 1,
                }),
            });
            console.log(`[HubSpot] 検索APIレスポンス: status=${response.status}, ok=${response.ok}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[HubSpot] 検索APIエラー: status=${response.status}, error=${JSON.stringify(errorData)}`);
                if (response.status === 404) {
                    console.log(`[HubSpot] 連絡先が見つかりませんでした: email=${email}`);
                    return null; // 連絡先が見つからない
                }
                throw new Error(`HubSpot検索エラー: ${response.status} - ${JSON.stringify(errorData)}`);
            }
            const data = await response.json();
            console.log(`[HubSpot] 検索結果: results=${data.results?.length || 0}`);
            if (data.results && data.results.length > 0) {
                console.log(`[HubSpot] 連絡先が見つかりました: contactId=${data.results[0].id}`);
                return { id: data.results[0].id };
            }
            console.log(`[HubSpot] 連絡先が見つかりませんでした: email=${email}`);
            return null;
        }
        catch (error) {
            console.error('[HubSpot] 連絡先検索エラー:', {
                email,
                error: error?.message || error,
                stack: error?.stack
            });
            return null;
        }
    }
    /**
     * 新しい連絡先を作成
     */
    async createContact(contact) {
        console.log(`[HubSpot] 連絡先作成API呼び出し: email=${contact.email}, propertiesCount=${Object.keys(contact).length}`);
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                properties: contact,
            }),
        });
        console.log(`[HubSpot] 作成APIレスポンス: status=${response.status}, ok=${response.ok}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                status: 'ERROR',
                message: 'Unknown error',
                correlationId: '',
                category: 'UNKNOWN',
            }));
            console.error(`[HubSpot] 作成APIエラー: status=${response.status}, error=${JSON.stringify(errorData)}`);
            throw new Error(`HubSpot連絡先作成エラー: ${response.status} - ${errorData.message}`);
        }
        const result = await response.json();
        console.log(`[HubSpot] 連絡先作成成功: contactId=${result.id}`);
        return result;
    }
    /**
     * 既存の連絡先を更新
     */
    async updateContact(contactId, contact) {
        console.log(`[HubSpot] 連絡先更新API呼び出し: contactId=${contactId}, email=${contact.email}, propertiesCount=${Object.keys(contact).length}`);
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                properties: contact,
            }),
        });
        console.log(`[HubSpot] 更新APIレスポンス: status=${response.status}, ok=${response.ok}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                status: 'ERROR',
                message: 'Unknown error',
                correlationId: '',
                category: 'UNKNOWN',
            }));
            console.error(`[HubSpot] 更新APIエラー: status=${response.status}, error=${JSON.stringify(errorData)}`);
            throw new Error(`HubSpot連絡先更新エラー: ${response.status} - ${errorData.message}`);
        }
        const result = await response.json();
        console.log(`[HubSpot] 連絡先更新成功: contactId=${contactId}`);
        return result;
    }
    /**
     * カスタムプロパティを作成（存在しない場合）
     * HubSpot公式ドキュメント: https://developers.hubspot.jp/docs/api-reference/crm-properties-v3/guide
     */
    async createCustomProperty(propertyName, propertyConfig) {
        if (!this.apiKey) {
            return { success: false, message: 'APIキーが設定されていません' };
        }
        try {
            // まず既存のプロパティを確認
            const checkResponse = await fetch(`${this.baseUrl}/crm/v3/properties/contacts/${propertyName}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            if (checkResponse.ok) {
                return { success: true, message: `プロパティ ${propertyName} は既に存在します` };
            }
            // プロパティが存在しない場合は作成
            const requestBody = {
                name: propertyName,
                label: propertyConfig.label,
                type: propertyConfig.type,
                fieldType: propertyConfig.fieldType,
            };
            if (propertyConfig.groupName) {
                requestBody.groupName = propertyConfig.groupName;
            }
            if (propertyConfig.description) {
                requestBody.description = propertyConfig.description;
            }
            // enumerationタイプの場合はoptionsが必要
            if (propertyConfig.type === 'enumeration') {
                if (propertyConfig.options && propertyConfig.options.length > 0) {
                    requestBody.options = propertyConfig.options;
                }
                else {
                    // optionsが指定されていない場合はデフォルトの空配列を設定
                    requestBody.options = [];
                }
            }
            const response = await fetch(`${this.baseUrl}/crm/v3/properties/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // 409 Conflict は既にプロパティが存在する場合
                if (response.status === 409) {
                    return { success: true, message: `プロパティ ${propertyName} は既に存在します` };
                }
                const errorMessage = errorData.message || JSON.stringify(errorData);
                throw new Error(`HubSpotプロパティ作成エラー: ${response.status} - ${errorMessage}`);
            }
            const result = await response.json();
            console.log(`✅ HubSpotプロパティ ${propertyName} を作成しました`);
            return { success: true, message: `プロパティ ${propertyName} を作成しました` };
        }
        catch (error) {
            const errorMessage = error.message || String(error);
            console.error(`HubSpotプロパティ作成エラー (${propertyName}):`, errorMessage);
            return { success: false, message: errorMessage };
        }
    }
    /**
     * 複数のカスタムプロパティを一括作成
     */
    async createCustomProperties(properties) {
        const results = [];
        for (const prop of properties) {
            const result = await this.createCustomProperty(prop.name, prop);
            results.push({ name: prop.name, ...result });
            // レート制限を避けるため、少し待機
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return results;
    }
}
