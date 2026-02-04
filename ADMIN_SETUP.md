# 管理员权限设置指南

系统现在已经区分了管理员和普通用户。只有管理员可以访问"管理源"页面和执行抓取操作。

## 设置步骤

### 1. 在Supabase Dashboard执行SQL

访问你的 Supabase Dashboard:
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

执行以下SQL：

```sql
-- 添加用户角色字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加检查约束
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 设置你的账户为管理员（替换为你的邮箱）
UPDATE users SET role = 'admin' WHERE email = 'joelyan00@gmail.com';
```

### 2. 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 3. 验证权限

- 以管理员账户登录后，应该能看到"管理源"链接
- 普通用户登录后，不会看到"管理源"链接
- 未登录用户无法访问管理源页面

## 权限说明

### 管理员 (role = 'admin')
- ✅ 查看首页新闻
- ✅ 关注新闻源
- ✅ 查看"我的关注"
- ✅ **访问"管理源"页面**
- ✅ **添加/编辑/删除新闻源**
- ✅ **执行"全部抓取"**

### 普通用户 (role = 'user')
- ✅ 查看首页新闻
- ✅ 关注新闻源
- ✅ 查看"我的关注"
- ❌ 无法访问"管理源"页面
- ❌ 无法添加/编辑/删除新闻源
- ❌ 无法执行抓取操作

## 受保护的资源

以下API和页面需要管理员权限：

- `/sources` - 管理源页面
- `/api/sources` (GET, POST, PUT, DELETE) - 新闻源管理API
- `/api/fetch` (POST) - 手动抓取API
- `/api/categories` (POST, PUT, DELETE) - 分类管理API

## 添加新管理员

如果需要添加更多管理员，在Supabase SQL Editor中执行：

```sql
UPDATE users SET role = 'admin' WHERE email = 'another-admin@example.com';
```

## 取消管理员权限

```sql
UPDATE users SET role = 'user' WHERE email = 'user@example.com';
```

## 查看所有管理员

```sql
SELECT id, email, username, role, created_at
FROM users
WHERE role = 'admin';
```

## 安全建议

1. **限制管理员数量**：只给信任的人管理员权限
2. **定期审查**：定期检查管理员列表
3. **使用强密码**：管理员账户应使用强密码
4. **记录操作日志**：可以考虑添加操作日志功能（未来改进）

## 技术实现

- **数据库**: users表添加了role字段
- **类型定义**: User interface包含role?: 'admin' | 'user'
- **中间件**: lib/auth/adminAuth.ts - verifyAdmin()
- **前端保护**: 使用UserContext检查user.role
- **API保护**: 所有管理API调用verifyAdmin()验证

## 故障排除

### 问题：登录后还是看不到"管理源"链接

解决方案：
1. 确认SQL已执行成功
2. 重启开发服务器
3. 清除浏览器cookie并重新登录
4. 在Supabase检查用户的role字段是否为'admin'

### 问题：访问管理源页面被重定向

原因：用户role不是'admin'或未登录

解决方案：
1. 确认已设置role为'admin'
2. 重新登录
3. 检查浏览器控制台是否有错误

### 问题：API返回403 Unauthorized

原因：verifyAdmin()验证失败

解决方案：
1. 确认JWT token有效
2. 确认数据库中role为'admin'
3. 检查服务器日志
