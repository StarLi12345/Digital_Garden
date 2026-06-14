# ANIMATION_GUIDE.md

> Digital Garden 动画设计规范。
>
> 目标：让页面更温柔，不是更炫。
> 如果用户注意到动画本身，说明动画已经过度了。

---

## 一、动画原则

### 第一原则：不打扰

动画的存在是为了让过渡更自然，不是为了吸引注意力。

用户应该感受到**舒适**，而不是感受到**动画**。

### 第二原则：轻、慢、自然

- **轻**：变化幅度小（2-4px 位移，0.97 缩放）
- **慢**：时长在 150ms-250ms 之间
- **自然**：使用 `easeOut` 缓动，模拟物理世界的减速

### 第三原则：统一管理

所有动画参数集中在 `src/lib/animations.ts`。
**禁止在组件中散落动画参数。**

---

## 二、动画清单

### 已实现

| 动画 | 类型 | 时长 | 缓动 | 实现方式 |
|------|------|------|------|---------|
| 页面切换淡入 | 路由切换 | 250ms | easeOut | Framer Motion `pageVariants` |
| 页面切出 | 路由切换 | 150ms | easeIn | Framer Motion `pageVariants.exit` |
| 卡片 Hover | 鼠标悬停 | 150-200ms | easeOut | Framer Motion `cardVariants` |
| 按钮 Hover | 颜色过渡 | 150ms | easeOut | CSS `.interactive` 类 |
| 输入框 Focus | Focus Ring | 150ms | easeOut | CSS `.focus-ring` 类 |

### 预留（已定义变体，暂未使用）

| 动画 | 触发场景 | 计划使用阶段 |
|------|---------|------------|
| Modal 弹出 | 删除确认 / 图片预览 | Phase 2+ |
| Toast 通知 | 保存成功/失败提示 | Phase 1+ |
| Accordion 折叠 | 设置页 / 标签管理 | Phase 3+ |
| 列表交错入场 | Entry 列表加载 | Phase 1+ |

---

## 三、动画时长规范

| 用途 | 时长 | 理由 |
|------|------|------|
| 页面切换 | 200-250ms | 路由切换需要稍长时间，让用户感知到页面变化 |
| 模态框 | 200ms | 比页面稍快，弹出层不应拖慢操作 |
| Hover 反馈 | 150ms | 即时反馈，再慢就会感觉"迟钝" |
| Focus 反馈 | 150ms | 同 Hover |
| Toast 弹出 | 250ms | 需要用户注意到，但不能打断操作 |
| Accordion | 200-250ms | 展开/折叠需要流畅感 |

---

## 四、禁止动画列表

以下动画**在任何阶段都不允许**使用：

| 禁止类型 | 原因 |
|---------|------|
| 粒子系统 | 过度炫技，分散注意力 |
| 樱花飘落 | 过分二次元标签化 |
| Live2D 角色 | 不属于 Digital Garden 定位 |
| 看板娘 | 同上 |
| 背景视频 | 干扰阅读，消耗性能 |
| 视差滚动 | 过度设计 |
| 卡片翻转 | 干扰信息获取 |
| 3D 动画 | 与安静/温暖的调性冲突 |
| 页面缩放进入 | 过于激烈 |
| 弹跳动画 | 不严肃，不适配长期陪伴定位 |
| 无限循环动画 | 分散注意力 |
| 闪烁 / 脉冲 | 会造成焦虑感 |

---

## 五、Framer Motion 使用规范

### 文件结构

```
src/lib/animations.ts        ← 全部动画变体集中定义
src/components/ui/
  page-transition.tsx         ← 页面路由切换
  (future) modal.tsx          ← 模态框
  (future) toast.tsx          ← 通知
  (future) accordion.tsx      ← 折叠面板
```

### 变体命名规范

```typescript
// 命名格式：<元素>Variants
export const pageVariants: Variants = { ... }
export const cardVariants: Variants = { ... }
export const modalVariants: Variants = { ... }
export const toastVariants: Variants = { ... }
export const accordionVariants: Variants = { ... }

// 状态命名（统一）：
//   hidden → visible  (用于条件渲染的元素)
//   initial → animate  (用于页面进入)
//   rest → hover       (用于交互 Hover)
```

### 在组件中使用

```tsx
"use client";
import { motion } from "framer-motion";
import { cardVariants } from "@/lib/animations";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
    >
      {children}
    </motion.div>
  );
}
```

### 性能注意事项

1. **不要在 `motion.div` 上使用 `whileHover` 时改变 `scale`**：会触发 layout 重计算。改用 `translateY`。
2. **列表动画使用 `layout` prop**：Framer Motion 的 `layout` 动画比 CSS 更流畅。
3. **`AnimatePresence` 必须设置 `mode`**：避免多个元素同时动画导致 layout shift。
4. **服务端组件不需要 `"use client"`**：只有使用 `motion.*` 或 `AnimatePresence` 的组件才需要。

---

## 六、与 CSS 动画的分工

| 场景 | 使用 | 原因 |
|------|------|------|
| 页面切换 | Framer Motion | 需要 AnimatePresence 管理 enter/exit |
| 模态框弹出 | Framer Motion | 需要 exit 动画 |
| Toast 弹出 | Framer Motion | 需要 exit 动画 |
| 按钮 Hover 颜色变化 | CSS `.interactive` | 高频交互，CSS 性能更好 |
| 输入框 Focus 环 | CSS `.focus-ring` | 浏览器原生 `:focus-visible` 配合 |
| 卡片 Hover 位移 | Framer Motion | 需要 `whileHover` 的 spring 感 |

---

> **最终检验**：打开任意页面，切换路由，观察页面过渡。
>
> 如果你注意到"哦，有动画"——说明时长或幅度大了。
>
> 如果你只是觉得"挺流畅的"——那就是对的。
