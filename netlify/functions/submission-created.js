/**
 * Netlify Function: submission-created
 * URLの重複を防止し、確実にリセットページへ誘導する安定版
 */
exports.handler = async (event) => {
  try {
    // 1. 送信されたフォームデータを解析
    const body = JSON.parse(event.body);
    const payload = body.payload;
    const userEmail = payload.data.email; 

    console.log(`送信を受け付けました。宛先: ${userEmail}`);

    // 2. URLの整形（二重 https:// を防ぎ、末尾の / も調整する）
    let siteUrl = process.env.URL || '';
    // もしURLが含まれていなければ、えどすんのサイトURLを直書きで補完
    if (!siteUrl) siteUrl = 'https://cfauth.netlify.app';
    
    // 末尾の / を削除して、きれいなベースURLを作る
    const cleanUrl = siteUrl.replace(/\/$/, "");

    // 3. Resend API を使ってメールを送信
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
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007bff;">パスワード再設定のリクエスト</h2>
            <p>こんにちは。パスワード再設定のリクエストを受け付けました。</p>
            <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            <p style="margin: 30px 0;">
              <a href="${cleanUrl}/reset_password.html" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                 パスワードを再設定する
              </a>
            </p>
            <p style="font-size: 0.9em; color: #666;">
              ※このリンクの有効期限は24時間です。<br>
              ※心当たりがない場合は、このメールを破棄してください。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #999;">Powered by Netlify & Resend</p>
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
  } catch (err) {
    console.error('システムエラー:', err);
    return { statusCode: 500, body: err.toString() };
  }
};