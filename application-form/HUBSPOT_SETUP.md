# HubSpot連携セットアップガイド

このドキュメントでは、justjoinプラットフォームとHubSpotの連携設定方法を説明します。

## 概要

求職者が書類を作成・更新すると、その情報が自動的にHubSpotの連絡先（Contact）として作成または更新されます。

## 必要な設定

### 1. HubSpot APIキーの取得

1. HubSpotアカウントにログイン
2. 設定（Settings）→ 統合（Integrations）→ プライベートアプリ（Private Apps）に移動
3. 新しいプライベートアプリを作成
4. 以下のスコープを付与：
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.schemas.contacts.read`
   - `crm.schemas.contacts.write`
5. APIキーをコピー

### 2. 環境変数の設定

GCP Cloud Runの環境変数に以下を追加：

```
HUBSPOT_API_KEY=your_hubspot_api_key_here
```

**設定方法：**
```bash
gcloud run services update application-form \
  --set-env-vars HUBSPOT_API_KEY=your_hubspot_api_key_here \
  --region=asia-northeast1 \
  --project=justjoin_platform
```

**注意:** 環境変数 `HUBSPOT_API_KEY` が設定されている必要があります。

### 3. HubSpotカスタムプロパティの作成

以下のカスタムプロパティは、システムが自動的に作成します。手動で作成する必要はありませんが、手動で作成する場合は以下の手順に従ってください。

**自動セットアップ（推奨）:**
システム起動時に自動的にプロパティが作成されます。または、以下のスクリプトを実行して手動でセットアップすることもできます：

```bash
# 開発環境で実行
cd application-form
npm run setup-hubspot
```

**手動セットアップ:**
HubSpotの設定（Settings）→ プロパティ（Properties）→ 連絡先（Contact）から作成できます。

#### 基本情報

| プロパティ名 | ラベル | タイプ | 説明 |
|------------|--------|--------|------|
| `birth_date` | 生年月日 | Date | 生年月日 |
| `gender` | 性別 | Select | 性別（男性、女性、その他） |
| `nationality` | 国籍 | Text | 国籍 |
| `address` | 現住所 | Text | 現住所 |
| `postal_code` | 郵便番号 | Text | 郵便番号 |
| `contact_address` | 連絡先住所 | Text | 連絡先住所 |
| `registration_type` | 登録タイプ | Select | エンジニアまたは一般職 |

#### 履歴書情報

| プロパティ名 | ラベル | タイプ | 説明 |
|------------|--------|--------|------|
| `self_pr` | 自己PR | Textarea | 自己PR |
| `education_history` | 学歴 | Textarea | 学歴（JSON形式） |
| `work_experience_history` | 職歴（履歴書） | Textarea | 職歴（JSON形式） |
| `qualifications` | 資格（履歴書） | Textarea | 資格（JSON形式） |

#### 職務経歴書情報

| プロパティ名 | ラベル | タイプ | 説明 |
|------------|--------|--------|------|
| `work_history` | 職務経歴 | Textarea | 職務経歴（JSON形式） |
| `work_history_qualifications` | 資格（職務経歴書） | Textarea | 資格（職務経歴書） |

#### スキルシート情報

| プロパティ名 | ラベル | タイプ | 説明 |
|------------|--------|--------|------|
| `skills` | スキル | Text | スキル一覧（カンマ区切り） |
| `skill_details` | スキル詳細 | Textarea | スキル詳細（JSON形式） |

### 4. プロパティ作成の詳細設定

#### `gender` プロパティ
- タイプ: Select
- オプション:
  - 男性 (value: `male`)
  - 女性 (value: `female`)
  - その他 (value: `other`)

#### `registration_type` プロパティ
- タイプ: Select
- オプション:
  - エンジニア (value: `engineer`)
  - 一般職 (value: `general`)

## 動作確認

1. 求職者が書類を作成・更新する
2. HubSpotの連絡先（Contacts）で、該当するメールアドレスの連絡先を確認
3. カスタムプロパティにデータが正しく保存されているか確認

## トラブルシューティング

### 連絡先が作成されない

- `HUBSPOT_API_KEY` 環境変数が正しく設定されているか確認
- HubSpotのAPIキーに必要なスコープが付与されているか確認
- サーバーログでHubSpot連携エラーを確認

### プロパティが保存されない

- HubSpot側でカスタムプロパティが正しく作成されているか確認
- プロパティ名が正確に一致しているか確認（大文字小文字を区別）
- プロパティのタイプが正しいか確認

### エラーログの確認

Cloud Runのログを確認：
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=application-form" --limit 50 --project=justjoin_platform
```

## 注意事項

- HubSpot連携でエラーが発生しても、書類の保存処理は続行されます
- メールアドレスが存在しないユーザーはHubSpot連携がスキップされます
- 既存の連絡先は更新され、新規の連絡先は作成されます

## 参考リンク

- [HubSpot API ドキュメント](https://developers.hubspot.jp/docs)
- [HubSpot Contacts API](https://developers.hubspot.com/docs/api/crm/contacts)

