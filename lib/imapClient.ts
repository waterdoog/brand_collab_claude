import Imap from 'imap';
import { EmailCredentials } from '@/types';

/**
 * 创建 IMAP 客户端连接（163 邮箱）
 */
export function createImapConnection(credentials: EmailCredentials): Imap {
  const imap = new Imap({
    user: credentials.email,
    password: credentials.password,
    host: 'imap.163.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000,
    connTimeout: 30000,
  });

  return imap;
}

/**
 * 获取邮箱中的邮件
 */
export function fetchEmails(
  imap: Imap,
  options: {
    box?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const { box = 'INBOX', startDate, endDate, limit = 100 } = options;
    const emails: any[] = [];

    imap.once('ready', () => {
      imap.openBox(box, true, (err, mailbox) => {
        if (err) {
          reject(err);
          return;
        }

        // 构建搜索条件
        const searchCriteria: any[] = ['ALL'];

        if (startDate) {
          searchCriteria.push(['SINCE', startDate]);
        }
        if (endDate) {
          searchCriteria.push(['BEFORE', endDate]);
        }

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          // 限制数量
          const uids = results.slice(-limit);

          const fetch = imap.fetch(uids, {
            bodies: '',
            struct: true,
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            let uid: number;

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
            });

            msg.once('end', () => {
              emails.push({ uid, buffer });
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.once('end', () => {
      resolve(emails);
    });

    imap.connect();
  });
}

/**
 * 测试 IMAP 连接
 */
export function testImapConnection(credentials: EmailCredentials): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials);

    imap.once('ready', () => {
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}
