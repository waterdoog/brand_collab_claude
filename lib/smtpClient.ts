import nodemailer from 'nodemailer';
import { EmailCredentials } from '@/types';

/**
 * 创建 SMTP 传输器（163 邮箱）
 */
export function createSmtpTransporter(credentials: EmailCredentials) {
  return nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
      user: credentials.email,
      pass: credentials.password,
    },
  });
}

/**
 * 发送邮件
 */
export async function sendEmail(
  credentials: EmailCredentials,
  options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<void> {
  const transporter = createSmtpTransporter(credentials);

  await transporter.sendMail({
    from: credentials.email,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    inReplyTo: options.inReplyTo,
    references: options.references,
  });
}

/**
 * 批量发送邮件
 */
export async function sendBatchEmails(
  credentials: EmailCredentials,
  emails: Array<{
    to: string;
    subject: string;
    text?: string;
    html?: string;
    inReplyTo?: string;
    references?: string;
  }>
): Promise<{ success: number; failed: number; errors: any[] }> {
  const transporter = createSmtpTransporter(credentials);
  let success = 0;
  let failed = 0;
  const errors: any[] = [];

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: credentials.email,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        inReplyTo: email.inReplyTo,
        references: email.references,
      });
      success++;
    } catch (error) {
      failed++;
      errors.push({ email: email.to, error });
    }
  }

  return { success, failed, errors };
}

/**
 * 测试 SMTP 连接
 */
export async function testSmtpConnection(credentials: EmailCredentials): Promise<boolean> {
  const transporter = createSmtpTransporter(credentials);
  await transporter.verify();
  return true;
}
