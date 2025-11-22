import type { NextApiRequest, NextApiResponse } from 'next';
import { sendBatchEmails } from '@/lib/smtpClient';
import { EmailCredentials } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, emails } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和授权码' });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: '请提供要发送的邮件列表' });
    }

    const credentials: EmailCredentials = { email, password };

    const result = await sendBatchEmails(credentials, emails);

    return res.status(200).json({
      success: true,
      ...result,
      message: `成功发送 ${result.success} 封邮件${result.failed > 0 ? `，${result.failed} 封失败` : ''}`,
    });
  } catch (error: any) {
    console.error('批量发送邮件失败:', error);

    return res.status(500).json({
      success: false,
      error: '批量发送邮件失败',
      details: error.message,
    });
  }
}
