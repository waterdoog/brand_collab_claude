import type { NextApiRequest, NextApiResponse } from 'next';
import { testImapConnection } from '@/lib/imapClient';
import { testSmtpConnection } from '@/lib/smtpClient';
import { EmailCredentials } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和授权码' });
    }

    const credentials: EmailCredentials = { email, password };

    // 测试 IMAP 连接
    const imapSuccess = await testImapConnection(credentials);

    // 测试 SMTP 连接
    const smtpSuccess = await testSmtpConnection(credentials);

    return res.status(200).json({
      success: true,
      imap: imapSuccess,
      smtp: smtpSuccess,
      message: '邮箱连接成功',
    });
  } catch (error: any) {
    console.error('测试连接失败:', error);

    let errorMessage = '连接失败';

    if (error.message?.includes('Invalid credentials') || error.responseCode === 535) {
      errorMessage = '邮箱或授权码错误，请检查：\n1. 邮箱地址是否正确\n2. 是否使用了授权码（不是邮箱密码）\n3. 是否已开启 IMAP/SMTP 服务';
    } else if (error.message?.includes('ECONNREFUSED')) {
      errorMessage = '无法连接到邮件服务器，请检查网络';
    } else if (error.message?.includes('ETIMEDOUT')) {
      errorMessage = '连接超时，请稍后重试';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message,
    });
  }
}
