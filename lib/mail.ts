import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * 发送验证码邮件
 * 如果没有配置 RESEND_API_KEY，则仅在控制台打印并返回成功（Mock 模式）
 */
export async function sendVerificationEmail(email: string, code: string) {
    const subject = `【知流】您的注册验证码：${code}`;
    const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
      <h2 style="color: #0d9488;">欢迎使用 知流</h2>
      <p>您好！感谢您注册知流。您的验证码是：</p>
      <div style="background: #f0fdfa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #0d9488; letter-spacing: 5px; border-radius: 5px;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 20px;">验证码有效期为 10 分钟。如果不是您本人操作，请忽略此邮件。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Powered by 知流 AI News Feed</p>
    </div>
  `;

    if (resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: '知流 <onboarding@resend.dev>', // 生产环境请使用自定义域名
                to: email,
                subject,
                html,
            });

            if (error) {
                console.error('Resend error:', error);
                throw new Error('邮件发送失败');
            }
            return data;
        } catch (err) {
            console.error('Mail send error:', err);
            throw err;
        }
    } else {
        // Mock 模式
        console.log('========================================');
        console.log(`[MOCK MAIL] To: ${email}`);
        console.log(`[MOCK MAIL] Subject: ${subject}`);
        console.log(`[MOCK MAIL] Code: ${code}`);
        console.log('========================================');
        return { mock: true };
    }
}
