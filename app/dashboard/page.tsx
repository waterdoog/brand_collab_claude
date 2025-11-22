'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandEmail, EmailTemplate } from '@/types';
import { exportToExcel, exportToCSV } from '@/lib/exportUtils';
import { replaceTemplateVariables } from '@/lib/emailParser';

export default function DashboardPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<BrandEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<BrandEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // 筛选条件
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // 模板
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyType, setReplyType] = useState<'YES' | 'NO'>('YES');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // 凭证
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // 从 localStorage 获取凭证
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');

    if (!savedEmail || !savedPassword) {
      router.push('/');
      return;
    }

    setEmail(savedEmail);
    setPassword(savedPassword);

    // 加载保存的模板
    loadTemplates();
  }, [router]);

  useEffect(() => {
    // 应用筛选
    let filtered = [...emails];

    if (startDate) {
      filtered = filtered.filter(e => new Date(e.receivedDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.receivedDate) <= new Date(endDate));
    }
    if (brandFilter) {
      filtered = filtered.filter(e =>
        e.brandName.toLowerCase().includes(brandFilter.toLowerCase())
      );
    }

    setFilteredEmails(filtered);
  }, [emails, startDate, endDate, brandFilter]);

  const loadTemplates = () => {
    const saved = localStorage.getItem('templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      // 默认模板
      const defaultTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: '接受合作（默认）',
          type: 'YES',
          subject: 'Re: {{subject}}',
          body: '您好 {{contact}}，\n\n感谢 {{brand_name}} 的合作邀请！\n\n我对这次合作很感兴趣，期待进一步沟通细节。\n\n请问接下来我们如何对接？\n\n期待您的回复！\n\n祝好',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: '拒绝合作（默认）',
          type: 'NO',
          subject: 'Re: {{subject}}',
          body: '您好 {{contact}}，\n\n感谢 {{brand_name}} 的合作邀请。\n\n非常抱歉，目前我的合作档期已满，暂时无法接受新的合作。\n\n期待未来有机会再次合作！\n\n祝好',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setTemplates(defaultTemplates);
      localStorage.setItem('templates', JSON.stringify(defaultTemplates));
    }
  };

  const syncEmails = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          limit: 100,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmails(data.emails);
        alert(`成功同步 ${data.total} 封品牌合作邮件`);
      } else {
        alert(data.error || '同步失败');
      }
    } catch (error) {
      alert('同步失败，请重试');
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleSelectEmail = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedEmails(newSelected);
  };

  const handleBatchReply = async (type: 'YES' | 'NO') => {
    if (selectedEmails.size === 0) {
      alert('请先选择要回复的邮件');
      return;
    }

    setReplyType(type);
    setShowReplyModal(true);
  };

  const sendBatchReplies = async () => {
    if (!selectedTemplate) {
      alert('请选择模板');
      return;
    }

    setLoading(true);

    try {
      const selectedEmailObjects = emails.filter(e => selectedEmails.has(e.id));

      const emailsToSend = selectedEmailObjects.map(email => ({
        to: email.from,
        subject: replaceTemplateVariables(selectedTemplate.subject, email),
        text: replaceTemplateVariables(selectedTemplate.body, email),
        inReplyTo: email.messageId,
        references: email.messageId,
      }));

      const response = await fetch('/api/send-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          emails: emailsToSend,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setSelectedEmails(new Set());
        setShowReplyModal(false);
      } else {
        alert(data.error || '发送失败');
      }
    } catch (error) {
      alert('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    if (filteredEmails.length === 0) {
      alert('没有可导出的邮件');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `品牌合作邮件_${timestamp}`;

    if (format === 'excel') {
      exportToExcel(filteredEmails, `${filename}.xlsx`);
    } else {
      exportToCSV(filteredEmails, `${filename}.csv`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('email');
    localStorage.removeItem('password');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">品牌合作邮件管理</h1>
                <p className="text-xs text-gray-500">{email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                模板管理
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* 时间筛选 */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">品牌名称</label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="搜索品牌..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={syncEmails}
              disabled={syncing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {syncing ? '同步中...' : '同步邮件'}
            </button>
          </div>

          {/* 批量操作 */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
            <button
              onClick={() => handleBatchReply('YES')}
              disabled={selectedEmails.size === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              批量接受 ({selectedEmails.size})
            </button>
            <button
              onClick={() => handleBatchReply('NO')}
              disabled={selectedEmails.size === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              批量拒绝 ({selectedEmails.size})
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={filteredEmails.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              导出 Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={filteredEmails.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              导出 CSV
            </button>
          </div>
        </div>

        {/* 邮件列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredEmails.length > 0 && selectedEmails.size === filteredEmails.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品牌名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">主题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">接收时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合作摘要</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报价</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {emails.length === 0 ? '点击"同步邮件"开始' : '没有符合条件的邮件'}
                    </td>
                  </tr>
                ) : (
                  filteredEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(email.id)}
                          onChange={(e) => handleSelectEmail(email.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{email.brandName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.contactPerson}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{email.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(email.receivedDate).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{email.collaborationSummary}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {email.hasPricing ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">有报价</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">无报价</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 回复模态框 */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {replyType === 'YES' ? '批量接受合作' : '批量拒绝合作'}
            </h2>
            <p className="text-gray-600 mb-4">将向 {selectedEmails.size} 封邮件发送回复</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择模板</label>
              <select
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择...</option>
                {templates.filter(t => t.type === replyType).map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">预览（使用第一封邮件）</h3>
                <p className="text-xs text-gray-600 mb-2">
                  主题: {replaceTemplateVariables(selectedTemplate.subject, filteredEmails.find(e => selectedEmails.has(e.id))!)}
                </p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {replaceTemplateVariables(selectedTemplate.body, filteredEmails.find(e => selectedEmails.has(e.id))!)}
                </pre>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={sendBatchReplies}
                disabled={!selectedTemplate || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '发送中...' : '确认发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模板管理模态框 */}
      {showTemplateModal && (
        <TemplateManager
          templates={templates}
          onClose={() => setShowTemplateModal(false)}
          onSave={(newTemplates) => {
            setTemplates(newTemplates);
            localStorage.setItem('templates', JSON.stringify(newTemplates));
          }}
        />
      )}
    </div>
  );
}

// 模板管理组件
function TemplateManager({
  templates,
  onClose,
  onSave,
}: {
  templates: EmailTemplate[];
  onClose: () => void;
  onSave: (templates: EmailTemplate[]) => void;
}) {
  const [localTemplates, setLocalTemplates] = useState([...templates]);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);

  const handleAddTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: '新模板',
      type: 'YES',
      subject: 'Re: {{subject}}',
      body: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditing(newTemplate);
  };

  const handleSaveTemplate = () => {
    if (!editing) return;

    const index = localTemplates.findIndex(t => t.id === editing.id);
    if (index >= 0) {
      localTemplates[index] = editing;
    } else {
      localTemplates.push(editing);
    }

    setLocalTemplates([...localTemplates]);
    setEditing(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      setLocalTemplates(localTemplates.filter(t => t.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">模板管理</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as 'YES' | 'NO' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="YES">接受合作</option>
                <option value="NO">拒绝合作</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮件主题</label>
              <input
                type="text"
                value={editing.subject}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮件内容（可用变量: {'{{'} brand_name {'}}'}, {'{{'} contact {'}}'}, {'{{'} date {'}}'}, {'{{'} subject {{'}'}})
              </label>
              <textarea
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {localTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${template.type === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {template.type === 'YES' ? '接受' : '拒绝'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.body}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditing(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleAddTemplate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                添加新模板
              </button>
              <button
                onClick={() => {
                  onSave(localTemplates);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存并关闭
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
