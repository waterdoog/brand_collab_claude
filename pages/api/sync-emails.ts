import type { NextApiRequest, NextApiResponse } from 'next';
import { createImapConnection, fetchEmails } from '@/lib/imapClient';
import { parseBrandEmail } from '@/lib/emailParser';
import { BrandEmail, EmailCredentials } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, startDate, endDate, limit } = req.body as {
      email: string;
      password: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    };

    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和授权码' });
    }

    const credentials: EmailCredentials = { email, password };

    // 创建 IMAP 连接
    const imap = createImapConnection(credentials);

    // 获取邮件
    const rawEmails = await fetchEmails(imap, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit || 100,
    });

    // 解析邮件
    const parsedEmails: BrandEmail[] = [];
    for (const { uid, buffer } of rawEmails) {
      const brandEmail = await parseBrandEmail(buffer, uid);
      if (brandEmail) {
        parsedEmails.push(brandEmail);
      }
    }

    // 按日期排序（最新的在前）
    parsedEmails.sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());

    return res.status(200).json({
      success: true,
      emails: parsedEmails,
      total: parsedEmails.length,
    });
  } catch (error: any) {
    console.error('同步邮件失败:', error);

    // 根据错误类型返回友好的错误信息
    let errorMessage = '同步邮件失败';

    if (error.message?.includes('Invalid credentials')) {
      errorMessage = '邮箱或授权码错误，请检查后重试';
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
