# 分类和用户关注系统实现计划

## 目标
实现新闻源分类管理和用户关注功能，允许用户关注感兴趣的媒体源并查看个性化feed。

## 数据库设计

### 1. 新增表：categories（分类表）
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始数据
INSERT INTO categories (name, description) VALUES
  ('传统新闻媒体', 'BBC, ABC, CBC等传统新闻机构'),
  ('YouTube网红', 'YouTube频道和内容创作者'),
  ('网络专业媒体', '雅虎财经、科技新闻等网络媒体');
```

### 2. 修改表：news_sources（添加分类字段）
```sql
ALTER TABLE news_sources
ADD COLUMN category_id UUID REFERENCES categories(id);
```

### 3. 新增表：users（用户表）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 4. 新增表：user_follows（用户关注表）
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source_id)
);

CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX idx_user_follows_source_id ON user_follows(source_id);
```

## 实现步骤

### Phase 1: 数据库和类型定义
- [ ] 创建数据库迁移SQL文件
- [ ] 在 `types/index.ts` 添加新类型定义
- [ ] 更新 Supabase queries 添加分类相关函数

### Phase 2: 用户认证系统
- [ ] 创建 `/api/auth/register` - 用户注册
- [ ] 创建 `/api/auth/login` - 用户登录
- [ ] 创建 `/api/auth/logout` - 用户登出
- [ ] 创建 `/api/auth/me` - 获取当前用户信息
- [ ] 实现 JWT token 认证中间件
- [ ] 创建登录/注册页面 UI

### Phase 3: 分类管理（后台）
- [ ] 创建 `/api/categories` - 获取所有分类
- [ ] 在 `/app/sources/page.tsx` 添加分类选择下拉框
- [ ] 更新源管理的创建/编辑逻辑包含分类

### Phase 4: 关注功能
- [ ] 创建 `/api/follows` POST - 关注媒体源
- [ ] 创建 `/api/follows` DELETE - 取消关注
- [ ] 创建 `/api/follows` GET - 获取用户关注列表
- [ ] 在主页新闻卡片添加"关注"按钮
- [ ] 实现关注状态显示（已关注/未关注）

### Phase 5: 个性化Feed页面
- [ ] 创建 `/app/following/page.tsx` - "我的关注"页面
- [ ] 创建 `/api/news/following` - 获取关注源的新闻
- [ ] 添加导航栏链接到关注页面

### Phase 6: 用户体验优化
- [ ] 添加登录状态管理（React Context）
- [ ] 未登录用户提示登录才能关注
- [ ] 添加关注数量统计
- [ ] 优化UI/UX交互

## 技术选型

### 认证方案
使用 JWT (JSON Web Token) + httpOnly cookies
- 安全性高
- 无需额外依赖库
- 与现有架构兼容

### 密码加密
使用 bcrypt
```bash
npm install bcrypt @types/bcrypt
```

### JWT生成
使用 jsonwebtoken
```bash
npm install jsonwebtoken @types/jsonwebtoken
```

## 文件结构

```
/app
  /api
    /auth
      /register/route.ts
      /login/route.ts
      /logout/route.ts
      /me/route.ts
    /categories/route.ts
    /follows/route.ts
    /news
      /following/route.ts
  /login/page.tsx
  /register/page.tsx
  /following/page.tsx
/lib
  /auth
    /jwt.ts
    /password.ts
    /middleware.ts
  /supabase
    /queries.ts (更新)
/types
  /index.ts (更新)
/database
  /migrations
    /001_add_categories.sql
    /002_add_users.sql
    /003_add_user_follows.sql
```

## API接口设计

### 认证相关
- `POST /api/auth/register` - 注册
  - Body: `{ email, username, password }`
  - Response: `{ user, token }`

- `POST /api/auth/login` - 登录
  - Body: `{ email, password }`
  - Response: `{ user, token }`

- `POST /api/auth/logout` - 登出
  - Response: `{ success: true }`

- `GET /api/auth/me` - 获取当前用户
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

### 分类相关
- `GET /api/categories` - 获取所有分类
  - Response: `{ categories: [...] }`

### 关注相关
- `POST /api/follows` - 关注媒体源
  - Body: `{ sourceId }`
  - Response: `{ success: true }`

- `DELETE /api/follows` - 取消关注
  - Body: `{ sourceId }`
  - Response: `{ success: true }`

- `GET /api/follows` - 获取用户关注列表
  - Response: `{ follows: [...] }`

### 新闻相关
- `GET /api/news/following` - 获取关注源的新闻
  - Query: `?limit=50`
  - Response: `{ news: [...] }`

## 注意事项

1. **安全性**：
   - 密码必须加密存储（bcrypt）
   - JWT token使用httpOnly cookies防止XSS
   - API路由需要认证中间件保护

2. **性能**：
   - 关注列表查询使用索引优化
   - 考虑分页加载新闻

3. **用户体验**：
   - 关注操作需要乐观更新UI
   - 未登录用户友好提示
   - 加载状态反馈

4. **数据一致性**：
   - 使用数据库约束保证一致性
   - 级联删除处理关注关系
