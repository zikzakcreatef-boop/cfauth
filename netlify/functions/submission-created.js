/**
 * Netlify Function: submission-created
 * GASと連携してトークン付きの再設定メールを送る最終形態
 */
exports.handler = async (event) => {
  try {
    // 1. フォームデータの解析
    const body = JSON.parse(event.body);
    const payload = body.payload;
    const userEmail = payload.data.email; 

    console.log(`処理開始: ${userEmail}`);

    // 2. GASにトークン発行を依頼
    // ※ Netlifyの環境変数に GAS_URL が設定されている前提だぜ！
    const gasUrl = process.env.GAS_URL;
    if (!gasUrl) {
      throw new Error("環境変数 GAS_URL が設定されていません。");
    }

    const gasResponse = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'request_reset',
        email: userEmail
      })
    });

    const gasResult = await gasResponse.json();
    
    if (!gasResult.success) {
      console.error('GASエラー:', gasResult.message);
      return { statusCode: 500 };
    }

    const resetToken = gasResult.token; // GASから届いた「鍵」
    console.log(`トークン取得成功: ${resetToken}`);

    // 3. メールの送信（Resend）
    let siteUrl = process.env.URL || 'https://cfauth.netlify.app';
    const cleanUrl = siteUrl.replace(/\/$/, "");

    const resendResponse = await fetch('https://api.resend.com/emails', {
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
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007bff;">パスワード再設定のリクエスト</h2>
            <p>こんにちは。パスワード再設定のリクエストを受け付けました。</p>
            <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            <p style="margin: 30px 0;">
              <a href="${cleanUrl}/reset_password.html?token=${resetToken}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                 パスワードを再設定する
              </a>
            </p>
            <p style="font-size: 0.9em; color: #666;">
              ※このリンクに心当たりがない場合は、このメールを破棄してください。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #999;">Powered by Netlify & Resend</p>
          </div>
        `
      })
    });

    if (resendResponse.ok) {
      console.log('自動返信メール送信成功！');
      return { statusCode: 200 };
    } else {
      const errorText = await resendResponse.text();
      console.error('Resendエラー:', errorText);
      return { statusCode: 500 };
    }
  } catch (err) {
    console.error('システムエラー:', err.message);
    return { statusCode: 500, body: err.toString() };
  }
};