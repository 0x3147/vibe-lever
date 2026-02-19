# Sidebar Stick-Out Effect (CleanMyMac X Style)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现侧边栏"凸出"窗口外的 CleanMyMac X 效果。

**Architecture:** 透明窗口 + 负右边距重叠 + 主内容卡片

---

### Task 1: 开启 Tauri 透明窗口

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Step 1:** 在 windows 配置中添加 `"transparent": true`

```json
"decorations": false,
"transparent": true
```

**Step 2: Commit**
```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: enable transparent window for sidebar stick-out effect"
```

---

### Task 2: 移动渐变背景到 .app-frame

**Files:**
- Modify: `src/styles/globals.css`

**Step 1:** 删除 `body` 中的 `background` 和 `background-attachment` 属性（保留 `@apply text-foreground` 和 `font-family`）

**Step 2:** 删除 `.dark body` 块

**Step 3:** 新增 `.app-frame` 和 `.dark .app-frame`：

```css
.app-frame {
  background:
    radial-gradient(ellipse at 80% 10%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 10% 90%, rgba(148, 163, 184, 0.06) 0%, transparent 50%),
    linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 50%, #F8FAFC 100%);
}
.dark .app-frame {
  background:
    radial-gradient(ellipse at 80% 10%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 10% 90%, rgba(71, 85, 105, 0.08) 0%, transparent 50%),
    linear-gradient(135deg, #0A1628 0%, #0D2B2B 50%, #0A1A1A 100%);
}
```

**Step 4: Commit**
```bash
git add src/styles/globals.css
git commit -m "feat: move gradient background from body to .app-frame class"
```

---

### Task 3: 重构 __root.tsx 布局

**Files:**
- Modify: `src/routes/__root.tsx`

**Step 1:** 将 TitleBar 移入主卡片，主卡片加 `app-frame` 类：

```tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <div className="flex-1 flex flex-col rounded-xl my-2 mr-2 overflow-hidden shadow-xl app-frame">
    <TitleBar />
    <main className="flex-1 overflow-auto p-4">
      <Outlet />
    </main>
  </div>
</div>
```

**Step 2: 验证**
```bash
pnpm tsc --noEmit
```

**Step 3: Commit**
```bash
git add src/routes/__root.tsx
git commit -m "feat: restructure layout with main card for stick-out sidebar"
```

---

### Task 4: 侧边栏加负右边距和 z-index

**Files:**
- Modify: `src/components/sidebar/index.tsx`

**Step 1:** 修改外层 div className：

从：
```
className="flex flex-col w-56 shrink-0 m-2 rounded-xl shadow-xl bg-sidebar backdrop-blur-md border border-border overflow-hidden"
```

改为：
```
className="flex flex-col w-56 shrink-0 ml-2 my-2 mr-[-12px] rounded-xl shadow-xl bg-sidebar backdrop-blur-md border border-border overflow-hidden z-10 relative"
```

**Step 2: 验证**
```bash
pnpm tsc --noEmit
```

**Step 3: Commit**
```bash
git add src/components/sidebar/index.tsx
git commit -m "feat: sidebar stick-out effect with negative margin and z-index"
```
