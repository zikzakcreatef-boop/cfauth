/**
 * Netlify Function: submission-created
 * 標準の fetch を使用する修正版
 */
exports.handler = async (event) => {
  // 1. 送信されたフォームデータを解析
  const body = JSON.parse(event.body);
  const payload = body.payload;
  const userEmail = payload.data.email; 

  console.log(`送信を受け付けました。宛先: ${userEmail}`);

  // 2. Resend API を使ってメールを送信
  // Netlify Functions(Node.js 18以降)では require なしで fetch が使えるぜ！
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
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
    const errorText = await response.text();
    console.error('メール送信失敗:', errorText);
    return { statusCode: 500 };
  }
};