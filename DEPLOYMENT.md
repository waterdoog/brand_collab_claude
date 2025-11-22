# 部署指南

## Vercel 部署（推荐）

Vercel 是 Next.js 的最佳部署平台，完全免费且自动配置。

### 方法一：通过 Vercel CLI

1. 安装 Vercel CLI：
```bash
npm install -g vercel
```

2. 在项目根目录运行：
```bash
vercel
```

3. 跟随命令行提示：
   - 登录 Vercel 账号
   - 选择项目设置
   - 确认部署

4. 部署完成后，你会获得一个 URL，例如：
```
https://brand-collab-email.vercel.app
```

### 方法二：通过 GitHub + Vercel

1. 将代码推送到 GitHub：
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. 访问 [Vercel](https://vercel.com)

3. 点击 "New Project"

4. 导入你的 GitHub 仓库

5. Vercel 会自动检测到这是 Next.js 项目

6. 点击 "Deploy"

7. 等待部署完成（通常 1-2 分钟）

### 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名（例如：`email.yourdomain.com`）
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（可能需要几分钟到几小时）

## 其他部署选项

### Netlify

1. 安装 Netlify CLI：
```bash
npm install -g netlify-cli
```

2. 构建项目：
```bash
npm run build
```

3. 部署：
```bash
netlify deploy --prod
```

### 自托管（VPS/服务器）

1. 构建项目：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm start
```

3. 使用 PM2 保持运行：
```bash
npm install -g pm2
pm2 start npm --name "email-manager" -- start
pm2 save
pm2 startup
```

4. 配置 Nginx 反向代理：
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量（可选）

本项目默认不需要环境变量，但如果需要自定义配置，可以在 Vercel 中设置：

1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加需要的变量

## 注意事项

### Vercel Serverless 限制

- **执行时间限制**：免费版 10 秒，Pro 版 60 秒
- **内存限制**：1024 MB
- **请求大小限制**：5 MB

如果同步大量邮件可能超时，建议：
1. 限制每次同步的邮件数量（默认 100 封）
2. 分批次同步
3. 或升级到 Vercel Pro

### 防火墙和端口

确保服务器可以访问：
- **IMAP**: `imap.163.com:993` (SSL)
- **SMTP**: `smtp.163.com:465` (SSL)

如果部署在企业网络，可能需要配置防火墙规则。

## 故障排查

### 部署失败

1. 检查 Node.js 版本（需要 18.0+）
2. 清除缓存：`rm -rf .next node_modules`
3. 重新安装：`npm install`
4. 重新构建：`npm run build`

### 运行时错误

1. 检查浏览器控制台
2. 检查 Vercel 日志
3. 确认 API 路由正常工作

### IMAP/SMTP 连接问题

1. 确认服务器可以访问外网
2. 检查防火墙规则
3. 尝试本地运行测试

## 更新部署

### Vercel 自动部署

如果使用 GitHub 集成，只需：
```bash
git push origin main
```

Vercel 会自动检测更新并重新部署。

### 手动更新

```bash
vercel --prod
```

## 监控和日志

### Vercel 日志

1. 访问 Vercel Dashboard
2. 选择项目
3. 点击 "Logs"
4. 查看实时日志和错误

### 自定义监控

可以集成：
- Sentry（错误追踪）
- LogRocket（用户行为）
- Google Analytics（访问统计）

## 性能优化

1. **启用 Edge Caching**：
   - Vercel 自动优化静态资源

2. **图片优化**：
   - 使用 Next.js Image 组件

3. **代码分割**：
   - Next.js 自动代码分割

4. **CDN**：
   - Vercel 自带全球 CDN

## 安全建议

1. **HTTPS**：Vercel 自动提供 SSL 证书
2. **环境变量**：不要在代码中硬编码敏感信息
3. **CORS**：配置允许的域名
4. **速率限制**：考虑添加 API 请求限制

---

**祝部署顺利！🚀**
