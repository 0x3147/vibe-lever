# Glassmorphism Teal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为应用深色模式添加深海青玻璃拟态风格：渐变背景 + 半透明 CSS 变量 + TitleBar/Sidebar 毛玻璃效果。

**Architecture:** 方案 C — globals.css 处理背景渐变和 CSS 变量，TitleBar/Sidebar 单独加 backdrop-blur-sm。

**Tech Stack:** Tailwind CSS v4, shadcn/ui, CSS custom properties

---

### Task 1: 更新 globals.css

**Files:**
- Modify: `src/styles/globals.css`

**Step 1: 替换 .dark 块内容**

将 `.dark { ... }` 整块替换为：

```css
.dark {
    --background: transparent;
    --foreground: #F1F5F9;
    --card: rgba(255, 255, 255, 0.05);
    --card-foreground: #F1F5F9;
    --popover: rgba(10, 22, 40, 0.92);
    --popover-foreground: #F1F5F9;
    --primary: #06B6D4;
    --primary-foreground: #0A1628;
    --secondary: rgba(255, 255, 255, 0.08);
    --secondary-foreground: #F1F5F9;
    --muted: rgba(255, 255, 255, 0.05);
    --muted-foreground: #94A3B8;
    --accent: rgba(255, 255, 255, 0.08);
    --accent-foreground: #F1F5F9;
    --destructive: #F87171;
    --border: rgba(255, 255, 255, 0.08);
    --input: rgba(255, 255, 255, 0.08);
    --ring: #06B6D4;
    --chart-1: #06B6D4;
    --chart-2: #60A5FA;
    --chart-3: #FBBF24;
    --chart-4: #A78BFA;
    --chart-5: #F87171;
    --sidebar: rgba(255, 255, 255, 0.03);
    --sidebar-foreground: #F1F5F9;
    --sidebar-primary: #06B6D4;
    --sidebar-primary-foreground: #0A1628;
    --sidebar-accent: rgba(255, 255, 255, 0.08);
    --sidebar-accent-foreground: #F1F5F9;
    --sidebar-border: rgba(255, 255, 255, 0.06);
    --sidebar-ring: #06B6D4;
}
```

**Step 2: 更新 @layer base 中的 body**

将：
```css
  body {
    @apply bg-background text-foreground;
    font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  }
```

替换为：
```css
  body {
    @apply bg-background text-foreground;
    font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  }
  .dark body {
    background:
      radial-gradient(ellipse at 80% 10%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 10% 90%, rgba(71, 85, 105, 0.08) 0%, transparent 50%),
      linear-gradient(135deg, #0A1628 0%, #0D2B2B 50%, #0A1A1A 100%);
    background-attachment: fixed;
  }
```

**Step 3: 验证**

```bash
pnpm tsc --noEmit
```

期望：无错误输出。

**Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add glassmorphism teal gradient background and glass CSS variables"
```

---

### Task 2: 更新 TitleBar

**Files:**
- Modify: `src/components/title-bar/index.tsx`

**Step 1: 修改外层 div className**

将：
```
className="flex items-center justify-between h-9 bg-background border-b border-border px-4 select-none shrink-0"
```

替换为：
```
className="flex items-center justify-between h-9 bg-white/5 backdrop-blur-sm border-b border-white/8 px-4 select-none shrink-0"
```

**Step 2: 验证**

```bash
pnpm tsc --noEmit
```

期望：无错误输出。

**Step 3: Commit**

```bash
git add src/components/title-bar/index.tsx
git commit -m "feat: apply glass effect to TitleBar"
```

---

### Task 3: 更新 Sidebar

**Files:**
- Modify: `src/components/sidebar/index.tsx`

**Step 1: 修改外层 div className**

将：
```
className="flex flex-col w-52 shrink-0 h-full bg-sidebar border-r border-border"
```

替换为：
```
className="flex flex-col w-52 shrink-0 h-full bg-white/3 backdrop-blur-sm border-r border-white/8"
```

**Step 2: 验证**

```bash
pnpm tsc --noEmit
```

期望：无错误输出。

**Step 3: Commit**

```bash
git add src/components/sidebar/index.tsx
git commit -m "feat: apply glass effect to Sidebar"
```
