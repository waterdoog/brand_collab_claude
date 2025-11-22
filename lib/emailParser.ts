import { BrandEmail } from '@/types';
import { simpleParser } from 'mailparser';

/**
 * 从邮件内容中提取品牌方信息
 */
export async function parseBrandEmail(rawEmail: any, uid: number): Promise<BrandEmail | null> {
  try {
    const parsed = await simpleParser(rawEmail);

    // 提取发件人信息
    const from = parsed.from?.text || '';
    const fromEmail = parsed.from?.value?.[0]?.address || '';

    // 提取品牌名称（从发件人或主题）
    const brandName = extractBrandName(from, parsed.subject || '');

    // 提取联系人
    const contactPerson = extractContactPerson(from);

    // 获取邮件正文
    const body = parsed.text || parsed.html || '';

    // 检测是否是合作邮件
    if (!isCollaborationEmail(parsed.subject || '', body)) {
      return null;
    }

    // 提取合作内容摘要
    const collaborationSummary = extractCollaborationSummary(body);

    // 提取需求
    const requirements = extractRequirements(body);

    // 检测是否包含报价
    const hasPricing = detectPricing(body);

    return {
      id: uid.toString(),
      messageId: parsed.messageId || uid.toString(),
      from: fromEmail,
      brandName,
      contactPerson,
      subject: parsed.subject || '(无主题)',
      receivedDate: parsed.date || new Date(),
      collaborationSummary,
      requirements,
      hasPricing,
      body,
      rawEmail: parsed,
    };
  } catch (error) {
    console.error('解析邮件失败:', error);
    return null;
  }
}

/**
 * 判断是否为合作邮件
 */
function isCollaborationEmail(subject: string, body: string): boolean {
  const keywords = [
    '合作', '广告', '推广', '投放', '商务', '品牌', '营销',
    'collaboration', 'partnership', 'promotion', 'advertising',
    'sponsored', 'campaign', 'influencer', 'creator',
    '邀请', '产品', '试用', '种草', '带货'
  ];

  const text = (subject + ' ' + body).toLowerCase();
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * 提取品牌名称
 */
function extractBrandName(from: string, subject: string): string {
  // 尝试从发件人提取
  const fromMatch = from.match(/^(.*?)\s*[<(]/);
  if (fromMatch && fromMatch[1]) {
    return fromMatch[1].trim();
  }

  // 尝试从邮箱域名提取
  const emailMatch = from.match(/@([^.]+)\./);
  if (emailMatch && emailMatch[1]) {
    return emailMatch[1];
  }

  // 尝试从主题提取
  const subjectMatch = subject.match(/【(.+?)】|「(.+?)」|\[(.+?)\]/);
  if (subjectMatch) {
    return subjectMatch[1] || subjectMatch[2] || subjectMatch[3];
  }

  return from.split('@')[0] || '未知品牌';
}

/**
 * 提取联系人
 */
function extractContactPerson(from: string): string {
  const match = from.match(/^(.*?)\s*[<(]/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return from.split('@')[0] || '未知';
}

/**
 * 提取合作内容摘要
 */
function extractCollaborationSummary(body: string): string {
  // 取前200个字符作为摘要
  const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // 尝试找到关键段落
  const patterns = [
    /合作.*?[。.]/,
    /推广.*?[。.]/,
    /希望.*?[。.]/,
    /邀请.*?[。.]/,
  ];

  for (const pattern of patterns) {
    const match = cleanBody.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return cleanBody.substring(0, 200) + (cleanBody.length > 200 ? '...' : '');
}

/**
 * 提取需求
 */
function extractRequirements(body: string): string {
  const cleanBody = body.replace(/<[^>]*>/g, '\n').replace(/\s+/g, ' ').trim();

  // 查找需求相关的段落
  const patterns = [
    /需要.*?[。.]/g,
    /要求.*?[。.]/g,
    /期望.*?[。.]/g,
  ];

  let requirements: string[] = [];
  for (const pattern of patterns) {
    const matches = cleanBody.match(pattern);
    if (matches) {
      requirements = requirements.concat(matches);
    }
  }

  if (requirements.length > 0) {
    return requirements.join(' ');
  }

  return '请查看邮件详情';
}

/**
 * 检测是否包含报价
 */
function detectPricing(body: string): boolean {
  const pricingKeywords = [
    '报价', '价格', '费用', '预算', '元', '￥', '$',
    'price', 'pricing', 'budget', 'cost', 'fee',
    'CNY', 'USD', 'RMB'
  ];

  return pricingKeywords.some(keyword =>
    body.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 替换邮件模板变量
 */
export function replaceTemplateVariables(
  template: string,
  email: BrandEmail
): string {
  return template
    .replace(/\{\{brand_name\}\}/g, email.brandName)
    .replace(/\{\{contact\}\}/g, email.contactPerson)
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('zh-CN'))
    .replace(/\{\{subject\}\}/g, email.subject);
}
