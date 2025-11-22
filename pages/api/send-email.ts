import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/smtpClient';
import { EmailCredentials } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, to, subject, body, inReplyTo, references } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和授权码' });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ error: '请提供收件人、主题和内容' });
    }

    const credentials: EmailCredentials = { email, password };

    await sendEmail(credentials, {
      to,
      subject,
      text: body,
      inReplyTo,
      references,
    });

    return res.status(200).json({
      success: true,
      message: '邮件发送成功',
    });
  } catch (error: any) {
    console.error('发送邮件失败:', error);

    let errorMessage = '发送邮件失败';

    if (error.message?.includes('Invalid credentials')) {
      errorMessage = '邮箱或授权码错误';
    } else if (error.message?.includes('ECONNREFUSED')) {
      errorMessage = '无法连接到邮件服务器';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message,
    });
  }
}
