# Dialog & Sidebar Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 Dialog 透明背景 bug，并将 Sidebar 重设计为 CleanMyMac X 浮动面板风格。

**Architecture:** 方案 C — dialog.tsx 修复 bg-background → bg-popover，sidebar 加 m-2/rounded-xl/shadow-xl 浮动效果，globals.css 更新 input 变量。

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui, CSS custom properties

---

### Task 1: 修复 dialog.tsx 透明背景

**Files:**
- Modify: `src/components/ui/dialog.tsx:62`

**Step 1: 修改 DialogContent className**

将 line 62 中的 `bg-background` 替换为 `bg-popover backdrop-blur-md`：

```
"bg-popover backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg"
```

**Step 2: 验证**

```bash
pnpm tsc --noEmit
```

期望：无错误输出。

**Step 3: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "fix: dialog transparent background by using bg-popover"
```

---

### Task 2: 更新 globals.css input 变量

**Files:**
- Modify: `src/styles/globals.css`

**Step 1: 更新 :root 中的 --input**

将 `:root` 中：
```css
--input: rgba(0, 0, 0, 0.06);
```
替换为：
```css
--input: rgba(255, 255, 255, 0.80);
```

**Step 2: 更新 .dark 中的 --input**

将 `.dark` 中：
```css
--input: rgba(255, 255, 255, 0.08);
```
替换为：
```css
--input: rgba(255, 255, 255, 0.10);
```

**Step 3: 验证**

```bash
pnpm tsc --noEmit
```

期望：无错误输出。

**Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "fix: improve input background visibility in light and dark modes"
```

---

### Task 3: 重设计 Sidebar 为 CleanMyMac X 浮动风格

**Files:**
- Modify: `src/components/sidebar/index.tsx`

**Step 1: 修改外层 div className**

将：
```
className="flex flex-col w-52 shrink-0 h-full bg-white/3 backdrop-blur-sm border-r border-white/8"
```
替换为：
```
className="flex flex-col w-56 shrink-0 m-2 rounded-xl shadow-xl bg-sidebar backdrop-blur-md border border-border overflow-hidden"
```

**Step 2: 修改 active 状态 className（共 2 处）**

将所有：
```
"bg-accent text-accent-foreground font-medium"
```
替换为：
```
"bg-primary/15 text-primary font-medium"
```

**Step 3: 修改 hover 状态 className（共 2 处）**

将所有：
```
"text-muted-foreground hover:bg-accent/50 hover:text-foreground"
```
替换为：
```
"text-muted-foreground hover:bg-primary/8 hover:text-foreground"
```

**Step 4: 验证**

```bash
pnpm tsc --noEmit
```

期望：无错误输出。

**Step 5: Commit**

```bash
git add src/components/sidebar/index.tsx
git commit -m "feat: redesign sidebar with CleanMyMac X floating panel style"
```
