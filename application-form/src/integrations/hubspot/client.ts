/**
 * HubSpot API クライアント
 * 
 * HubSpotのContacts APIを使用して求職者情報を連携します。
 * 環境変数 HUBSPOT_API_KEY が必要です。
 */

interface HubSpotContact {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  [key: string]: any; // カスタムプロパティ
}

interface HubSpotCreateContactResponse {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotUpdateContactResponse {
  id: string;
  properties: Record<string, string>;
  updatedAt: string;
}

interface HubSpotError {
  status: string;
  message: string;
  correlationId: string;
  category: string;
  subCategory?: string;
}

export class HubSpotClient {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUBSPOT_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ HUBSPOT_API_KEY が設定されていません。HubSpot連携はスキップされます。');
    }
  }

  /**
   * 連絡先を作成または更新
   * コンタクトIDが提供されている場合は直接更新、そうでない場合はメールアドレスで検索します。
   * @param contact 連絡先情報
   * @param contactId 既知のHubSpotコンタクトID（省略可能、提供された場合は検索をスキップ）
   */
  async createOrUpdateContact(
    contact: HubSpotContact,
    contactId?: string
  ): Promise<HubSpotCreateContactResponse | HubSpotUpdateContactResponse | null> {
    if (!this.apiKey) {
      console.error('[HubSpot] APIキーが設定されていません');
      return null;
    }

    try {
      console.log(`[HubSpot] 連絡先の作成/更新開始: email=${contact.email}, contactId=${contactId || '未指定'}`);
      
      // コンタクトIDが提供されている場合は直接更新を試みる
      if (contactId) {
        try {
          console.log(`[HubSpot] コンタクトIDで直接更新を試みます: contactId=${contactId}`);
          const result = await this.updateContact(contactId, contact);
          console.log(`[HubSpot] 連絡先更新成功: contactId=${contactId}`);
          return result;
        } catch (updateError: any) {
          // 更新に失敗した場合（例: コンタクトIDが無効）、メール検索にフォールバック
          console.warn(`[HubSpot] コンタクトIDでの更新に失敗。メール検索にフォールバック: contactId=${contactId}, error=${updateError?.message}`);
          // フォールバック処理に続く
        }
      }
      
      // メールアドレスで既存の連絡先を検索
      console.log(`[HubSpot] 既存連絡先を検索中: email=${contact.email}`);
      const existingContact = await this.findContactByEmail(contact.email);
      
      if (existingContact) {
        console.log(`[HubSpot] 既存連絡先が見つかりました: contactId=${existingContact.id}`);
        // 既存の連絡先を更新
        console.log(`[HubSpot] 連絡先を更新中: contactId=${existingContact.id}`);
        const result = await this.updateContact(existingContact.id, contact);
        console.log(`[HubSpot] 連絡先更新成功: contactId=${existingContact.id}`);
        return result;
      } else {
        console.log(`[HubSpot] 既存連絡先が見つかりませんでした。新規作成します: email=${contact.email}`);
        // 新しい連絡先を作成
        const result = await this.createContact(contact);
        console.log(`[HubSpot] 連絡先作成成功: contactId=${result.id}`);
        return result;
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('[HubSpot] 連絡先の作成/更新エラー:', {
        email: contact.email,
        contactId,
        error: errorMessage,
        stack: error?.stack
      });
      throw new Error(`HubSpot連絡先の作成/更新に失敗しました: ${errorMessage}`);
    }
  }

  /**
   * メールアドレスで連絡先を検索
   */
  private async findContactByEmail(email: string): Promise<{ id: string } | null> {
    try {
      console.log(`[HubSpot] 連絡先検索API呼び出し: email=${email}`);
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
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
        }
      );

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
    } catch (error: any) {
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
  private async createContact(contact: HubSpotContact): Promise<HubSpotCreateContactResponse> {
    console.log(`[HubSpot] 連絡先作成API呼び出し: email=${contact.email}, propertiesCount=${Object.keys(contact).length}`);
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          properties: contact,
        }),
      }
    );

    console.log(`[HubSpot] 作成APIレスポンス: status=${response.status}, ok=${response.ok}`);

    if (!response.ok) {
      const errorData: HubSpotError = await response.json().catch(() => ({
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
  private async updateContact(contactId: string, contact: HubSpotContact): Promise<HubSpotUpdateContactResponse> {
    console.log(`[HubSpot] 連絡先更新API呼び出し: contactId=${contactId}, email=${contact.email}, propertiesCount=${Object.keys(contact).length}`);
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          properties: contact,
        }),
      }
    );

    console.log(`[HubSpot] 更新APIレスポンス: status=${response.status}, ok=${response.ok}`);

    if (!response.ok) {
      const errorData: HubSpotError = await response.json().catch(() => ({
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
  async createCustomProperty(propertyName: string, propertyConfig: {
    label: string;
    type: 'string' | 'number' | 'date' | 'datetime' | 'enumeration' | 'bool';
    fieldType: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'checkbox' | 'radio' | 'file' | 'html';
    groupName?: string;
    options?: Array<{ label: string; value: string }>;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      return { success: false, message: 'APIキーが設定されていません' };
    }

    try {
      // まず既存のプロパティを確認
      const checkResponse = await fetch(
        `${this.baseUrl}/crm/v3/properties/contacts/${propertyName}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (checkResponse.ok) {
        return { success: true, message: `プロパティ ${propertyName} は既に存在します` };
      }

      // プロパティが存在しない場合は作成
      const requestBody: any = {
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
        } else {
          // optionsが指定されていない場合はデフォルトの空配列を設定
          requestBody.options = [];
        }
      }

      const response = await fetch(
        `${this.baseUrl}/crm/v3/properties/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

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
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      console.error(`HubSpotプロパティ作成エラー (${propertyName}):`, errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 複数のカスタムプロパティを一括作成
   */
  async createCustomProperties(properties: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'datetime' | 'enumeration' | 'bool';
    fieldType: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'checkbox' | 'radio' | 'file' | 'html';
    groupName?: string;
    options?: Array<{ label: string; value: string }>;
    description?: string;
  }>): Promise<Array<{ name: string; success: boolean; message: string }>> {
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

