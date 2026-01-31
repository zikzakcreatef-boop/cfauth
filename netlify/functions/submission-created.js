/**
 * Netlify Function: submission-created
 * フォームが送信された時に自動で実行されるスクリプト
 */
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. 送信されたフォームデータを解析
  const payload = JSON.parse(event.body).payload;
  const userEmail = payload.data.email; // フォームの name="email" から取得

  console.log(`送信を受け付けました。宛先: ${userEmail}`);

  // 2. Resend API を使ってメールを送信
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev', // 初回テスト用のアドレス
      to: userEmail,
      subject: '【重要】パスワード再設定のご案内',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>パスワード再設定のリクエスト</h2>
          <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
          <p style="margin: 30px 0;">
            <a href="https://${process.env.URL}/reset-password.html" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               パスワードを再設定する
            </a>
          </p>
          <p>※このリンクに心当たりがない場合は、このメールを破棄してください。</p>
        </div>
      `
    })
  });

  if (response.ok) {
    console.log('メール送信成功！');
    return { statusCode: 200 };
  } else {
    const error = await response.text();
    console.error('メール送信失敗:', error);
    return { statusCode: 500 };
  }
};