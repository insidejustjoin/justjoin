
import jwt from 'jsonwebtoken';

async function testSpotNotification() {
  try {
    console.log('スポット通知送信機能をテスト中...');

    // inside.justjoin@gmail.comの管理者アカウントIDを使用
    const adminId = '6';
    
    // JWTトークンを生成
    const token = jwt.sign(
      { id: adminId, email: 'inside.justjoin@gmail.com', role: 'admin' },
      'justjoin-jwt-secret-2024'
    );

    console.log('生成されたJWTトークン:', token);

    // スポット通知を送信
    const response = await fetch('https://justjoin.jp/api/notifications/admin/send-spot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'テスト通知',
        message: 'これはスポット通知送信機能のテストです。',
        type: 'info',
        targetUsers: 'all'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('スポット通知送信結果:', JSON.stringify(data, null, 2));
    } else {
      console.error('スポット通知送信エラー:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('エラー詳細:', errorText);
    }

  } catch (error) {
    console.error('テストエラー:', error);
  }
}

testSpotNotification(); 