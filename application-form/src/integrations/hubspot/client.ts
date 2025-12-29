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
   * メールアドレスで既存の連絡先を検索し、存在する場合は更新、存在しない場合は作成します。
   */
  async createOrUpdateContact(contact: HubSpotContact): Promise<HubSpotCreateContactResponse | HubSpotUpdateContactResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      // まずメールアドレスで既存の連絡先を検索
      const existingContact = await this.findContactByEmail(contact.email);
      
      if (existingContact) {
        // 既存の連絡先を更新
        return await this.updateContact(existingContact.id, contact);
      } else {
        // 新しい連絡先を作成
        return await this.createContact(contact);
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('HubSpot連絡先の作成/更新エラー:', errorMessage);
      throw new Error(`HubSpot連絡先の作成/更新に失敗しました: ${errorMessage}`);
    }
  }

  /**
   * メールアドレスで連絡先を検索
   */
  private async findContactByEmail(email: string): Promise<{ id: string } | null> {
    try {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          return null; // 連絡先が見つからない
        }
        throw new Error(`HubSpot検索エラー: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return { id: data.results[0].id };
      }
      return null;
    } catch (error: any) {
      console.error('HubSpot連絡先検索エラー:', error?.message || error);
      return null;
    }
  }

  /**
   * 新しい連絡先を作成
   */
  private async createContact(contact: HubSpotContact): Promise<HubSpotCreateContactResponse> {
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

    if (!response.ok) {
      const errorData: HubSpotError = await response.json().catch(() => ({
        status: 'ERROR',
        message: 'Unknown error',
        correlationId: '',
        category: 'UNKNOWN',
      }));
      throw new Error(`HubSpot連絡先作成エラー: ${response.status} - ${errorData.message}`);
    }

    return await response.json();
  }

  /**
   * 既存の連絡先を更新
   */
  private async updateContact(contactId: string, contact: HubSpotContact): Promise<HubSpotUpdateContactResponse> {
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

    if (!response.ok) {
      const errorData: HubSpotError = await response.json().catch(() => ({
        status: 'ERROR',
        message: 'Unknown error',
        correlationId: '',
        category: 'UNKNOWN',
      }));
      throw new Error(`HubSpot連絡先更新エラー: ${response.status} - ${errorData.message}`);
    }

    return await response.json();
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

