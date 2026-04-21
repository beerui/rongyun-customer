# 修复：接待端和客服端同浏览器冲突问题

## 问题描述

接待端（用户端）和客服端无法在同一浏览器的不同标签页中同时正常使用。

## 根本原因

两个端共享同一个 `localStorage` 键 `auth_token`，导致：

- Tab1 打开接待端 `/` → 写入用户 token
- Tab2 打开客服端 `/agent` → 覆盖为客服 token
- Tab1 刷新 → 读取到客服 token，API 调用失败

## 解决方案

为两个端使用不同的存储键：

- 接待端：`user_auth_token`
- 客服端：`agent_auth_token`

## 修改文件

1. `src/stores/auth.ts` - 定义两个独立的 token 键常量
2. `src/apis/http.ts` - HTTP 拦截器根据路由动态选择 token 键
3. `src/router/index.ts` - 路由守卫使用 `agent_auth_token`
4. `src/App.vue` - identity 刷新使用动态 token 键
5. `src/pages/pc/user/ChatEntry.vue` - URL 参数写入 `user_auth_token`

## 测试场景

1. **同时登录**
   - Tab1: 打开 `http://localhost:5173/` 作为接待端
   - Tab2: 打开 `http://localhost:5173/agent/login` 登录客服端
   - 验证：两个 tab 都能正常使用，互不干扰

2. **刷新测试**
   - 在场景1基础上，分别刷新两个 tab
   - 验证：刷新后仍保持各自的登录状态

3. **跨端切换**
   - Tab1 在接待端，直接访问 `/agent`
   - 验证：能正确跳转到客服登录页（因为没有 `agent_auth_token`）

## localStorage 结构

```
user_auth_token: "用户端的认证token"
agent_auth_token: "客服端的认证token"
agent_session: "{...客服会话信息...}"
```
