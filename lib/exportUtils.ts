import * as XLSX from 'xlsx';
import { BrandEmail } from '@/types';

/**
 * 导出邮件为 Excel
 */
export function exportToExcel(emails: BrandEmail[], filename: string = 'brand_emails.xlsx') {
  // 准备数据
  const data = emails.map(email => ({
    '品牌名称': email.brandName,
    '联系人': email.contactPerson,
    '发件人邮箱': email.from,
    '主题': email.subject,
    '接收时间': new Date(email.receivedDate).toLocaleString('zh-CN'),
    '合作摘要': email.collaborationSummary,
    '需求': email.requirements,
    '包含报价': email.hasPricing ? '是' : '否',
  }));

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // 设置列宽
  const colWidths = [
    { wch: 20 }, // 品牌名称
    { wch: 15 }, // 联系人
    { wch: 30 }, // 发件人邮箱
    { wch: 40 }, // 主题
    { wch: 20 }, // 接收时间
    { wch: 50 }, // 合作摘要
    { wch: 50 }, // 需求
    { wch: 10 }, // 包含报价
  ];
  ws['!cols'] = colWidths;

  // 添加工作表
  XLSX.utils.book_append_sheet(wb, ws, '品牌合作邮件');

  // 下载文件
  XLSX.writeFile(wb, filename);
}

/**
 * 导出邮件为 CSV
 */
export function exportToCSV(emails: BrandEmail[], filename: string = 'brand_emails.csv') {
  // 准备数据
  const data = emails.map(email => ({
    '品牌名称': email.brandName,
    '联系人': email.contactPerson,
    '发件人邮箱': email.from,
    '主题': email.subject,
    '接收时间': new Date(email.receivedDate).toLocaleString('zh-CN'),
    '合作摘要': email.collaborationSummary,
    '需求': email.requirements,
    '包含报价': email.hasPricing ? '是' : '否',
  }));

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Emails');

  // 下载 CSV
  XLSX.writeFile(wb, filename, { bookType: 'csv' });
}
