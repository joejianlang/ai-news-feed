# 用户关注系统设置指南

## 已完成的功能

✅ 数据库表结构（categories, users, user_follows）
✅ 用户注册/登录系统
✅ JWT认证
✅ 分类管理（传统新闻媒体、YouTube网红、网络专业媒体）
✅ 新闻源分类功能
✅ 关注/取消关注功能
✅ "我的关注"页面
✅ 主页显示关注按钮
✅ 导航栏（登录状态、用户菜单）

## 环境变量配置

请在 `.env.local` 文件中添加以下配置：

```env
# JWT密钥（用于生成和验证token）
JWT_SECRET=your-secret-key-here-change-this-to-random-string
```

**重要**: 请将 `JWT_SECRET` 修改为一个随机生成的字符串！

可以使用以下命令生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 使用流程

### 1. 管理员添加新闻源
1. 访问 `/sources` 页面
2. 点击"添加新闻源"
3. 填写新闻源信息，选择分类
4. 保存

### 2. 用户注册和登录
1. 访问 `/register` 注册账号
2. 或访问 `/login` 登录

### 3. 用户浏览和关注
1. 在主页浏览混合内容
2. 看到感兴趣的媒体，点击"+ 关注"按钮
3. 访问 `/following` 查看关注的媒体的新闻
