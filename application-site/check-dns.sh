#!/bin/bash

# DNS反映確認スクリプト

EXPECTED_IP="136.110.142.143"
DOMAIN="justjoin.jp"

echo "🔍 DNS設定の確認を開始します..."
echo "期待されるIPアドレス: ${EXPECTED_IP}"
echo ""

# DNS解決の確認
echo "=== DNS解決結果 ==="
RESOLVED_IP=$(dig +short ${DOMAIN} | head -1)

if [ -z "$RESOLVED_IP" ]; then
  echo "❌ DNS解決に失敗しました。DNS設定が反映されるまで待ってください。"
  exit 1
fi

echo "解決されたIPアドレス: ${RESOLVED_IP}"

if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
  echo "✅ DNS設定が正しく反映されています！"
else
  echo "⚠️  DNS設定がまだ反映されていない可能性があります。"
  echo "   期待値: ${EXPECTED_IP}"
  echo "   現在値: ${RESOLVED_IP}"
  echo "   しばらく待ってから再度確認してください。"
fi

echo ""
echo "=== HTTPステータス確認 ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN} 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ HTTPステータス: ${HTTP_STATUS} - サイトは正常に動作しています！"
elif [ "$HTTP_STATUS" = "000" ]; then
  echo "⚠️  サイトに接続できません。DNS設定の反映を待ってください。"
else
  echo "⚠️  HTTPステータス: ${HTTP_STATUS}"
fi

echo ""
echo "=== nslookup結果 ==="
nslookup ${DOMAIN} 2>&1 | grep -A 2 "Name:\|Address:" || echo "nslookup の実行に失敗しました"

