# Glassmorphism Teal Design

**Goal:** 为应用添加深海青玻璃拟态风格，渐变背景 + 轻度毛玻璃效果。

**Architecture:** 方案 C — CSS 变量层处理大部分，TitleBar 和 Sidebar 单独加 backdrop-blur。

**Tech Stack:** Tailwind CSS v4, shadcn/ui, CSS custom properties

---

## 配色系统

| Token | 值 |
|---|---|
| 背景渐变 | `#0A1628 → #0D2B2B → #0A1A1A` |
| 光晕右上 | `#06B6D4` (cyan/12) |
| 光晕左下 | `#475569` (slate/8) |
| Primary | `#06B6D4` (cyan-500) |
| Card bg | `rgba(255,255,255,0.05)` |
| Sidebar bg | `rgba(255,255,255,0.03)` |
| Border | `rgba(255,255,255,0.08)` |

## 组件调整

- **TitleBar**: `bg-white/5 backdrop-blur-sm border-white/8`
- **Sidebar**: `bg-white/3 backdrop-blur-sm border-white/8`
- 其余组件通过 CSS 变量自动继承

## 文件清单

- Modify: `src/styles/globals.css`
- Modify: `src/components/title-bar/index.tsx`
- Modify: `src/components/sidebar/index.tsx`
