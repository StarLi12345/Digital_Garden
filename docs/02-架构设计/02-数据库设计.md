# DATABASE.md

> Digital Garden 数据库设计文档。
>
> 写给半年后的自己：这份文档解释了你当时为什么这样设计数据库。
> 每一张表、每一个字段都有它的理由。

---

## 一、数据库概览

### 当前模型（MVP v0.1）

```
Entry ──┬── EntryTag ──┬── Tag
        │              │
        └── Asset      │
```

- **Entry**：核心内容实体。一切围绕它。
- **Tag**：轻量标签。不预设分类体系。
- **EntryTag**：Entry 与 Tag 的多对多桥梁。
- **Asset**：附件（图片、文件），与 Entry 解耦。

### 明确不在当前 Schema 中的模型

| 模型 | 为什么不在 |
|------|-----------|
| User | 单人本地使用。没有登录、没有用户表。 |
| Link | Wikilink / Backlinks 属于 Phase 7 (v0.8)。现在没有任何关联网络需求。 |
| EntryVersion | 历史版本属于 Phase 6 (v0.7)。当前所有编辑都直接覆盖。 |
| Setting | 只有"主题切换"一项设置。存 localStorage 即可。 |

---

## 二、Entry：数字花园中唯一的植物

### 为什么设计 Entry？

Entry 是整个 Digital Garden 的灵魂。

不是"文章"（Article），不是"笔记"（Note），不是"文档"（Document）。

它是一棵植物。种下去，随着时间推移，逐渐构成一个花园。

### 为什么这样设计字段？

#### `id: String @id @default(cuid())`

- **为什么是 String 而不是 Int**：cuid 生成的 ID 是全局唯一的，不依赖数据库自增。从 SQLite 迁移到 PostgreSQL 时不会产生 ID 冲突。
- **为什么用 cuid 而不是 uuid**：cuid 更短、URL 友好、包含时间戳信息，适合做 slug 的前缀。

#### `slug: String @unique`

- **为什么需要 slug**：URL 中不能放中文标题。`/entry/一个想法` 会变成一团乱码。slug 是标题的 URL 安全版本。
- **怎么生成**：应用层从标题自动生成（例如 `"我的第一个梦境"` → `"wo-de-di-yi-ge-meng-jing"`）。如果冲突，追加随机字符。

#### `type: String`

- **为什么是 String 而不是 Enum**：SQLite 不支持 Prisma 的 enum 语法。如果写入 enum，迁移会直接报错。
- **有效值**：`Memory` / `Thought` / `Emotion` / `Dream` / `Story` / `Learning`
- **校验方式**：在 Server Actions 中校验，不在数据库层约束。切换到 PostgreSQL 时可以转为数据库原生 enum。
- **为什么需要 type**：这是 Entry 的"一级分类"。它回答一个问题：这条记录是什么性质的东西？和标签不同——类型是互斥的，标签是叠加的。

#### `content: String` + `contentMd: String`

- **为什么双存储**：来自 ARCHITECTURE.md 的硬约束（Decision D-005）。
  - `content`：TipTap 编辑器的 JSON 输出。保留它意味着编辑器可以精确还原格式、嵌入、样式。
  - `contentMd`：从 TipTap JSON 自动转换的 Markdown。用于全文搜索和未来数据导出。
- **如果只有一个字段会怎样**：
  - 只有 JSON → 搜索需要解析 JSON 文本，慢且不准。导出困难。
  - 只有 Markdown → 编辑器无法精确还原富媒体（图片位置、嵌入内容）。
- **半年后的提示**：每次保存 Entry 时必须同时更新这两个字段。不要偷懒。

#### `excerpt: String?`

- **为什么独立存储**：列表页和搜索结果不可能渲染完整正文。每次从 contentMd 截取前 200 字很浪费。
- **为什么可为空**：新建并自动保存的草稿可能没有 contentMd，此时 excerpt 为 null。

#### `isPrivate: Boolean @default(false)`

- **为什么存在**：未来可能需要"仅自己可见"的条目标记。MVP 全是单用户，暂时用不到，但字段开销为零。
- **MVP 行为**：所有 Entry 默认可见。忽略此字段。

#### `createdAt` + `updatedAt`

- **为什么都需要**：`createdAt` 用于时间轴和"去年今日"；`updatedAt` 用于排序和"最近修改"。它们回答不同的问题。
- **`createdAt @default(now())` 的设计意图**：首次创建时自动填入当前时间。
- **`updatedAt @updatedAt` 的设计意图**：每次更新自动刷新。Prisma 原生支持。

### 为什么没有 coverImage？

封面系统属于 Phase 2 (v0.3)。MVP 中，列表卡片如果需要缩略图，可以通过 Entry 的第一个关联 Asset 来获取。

### 为什么没有 deletedAt？

MVP 不需要软删除。删除就是删除。未来如果需要"回收站"，再加这个字段。

### 索引策略

- `@@index([type])`：按类型筛选是核心操作（Garden 页面）
- `@@index([createdAt])`：按时间排序是核心操作（首页、列表）

---

## 三、Tag：最轻量的分类

### 为什么使用 Tag？

标签是用户组织和查找内容的最自由方式。

和文件夹不同：
- 文件夹是排他的（一个文件只能在一个文件夹里）
- 标签是叠加的（一条 Entry 可以有多个标签）

和类型不同：
- 类型是互斥的一级分类（一条 Entry 只能是 Memory 或 Dream）
- 标签是自由维度的补充（一条 Memory 可以同时标记 #旅行 #2024 #东京）

### 为什么 Tag 表这么"空"？

Tag 只有 `id`、`name`、`slug` 三个字段。

因为 Tag 不承担复杂结构。它只是一个名字，帮助用户检索和整理。

不需要描述、不需要图标、不需要颜色、不需要层级（父标签/子标签）。

如果未来需要这些，可以加。但 MVP 不需要。

### 为什么 name 和 slug 都有 @unique？

- `name @unique`：防止重复标签（"旅行"和"旅行"是同一个标签）
- `slug @unique`：URL 安全版本的唯一性

创建 Tag 时：如果 name 已存在 → 复用已有 Tag。不创建重复标签。

---

## 四、EntryTag：多对多的桥梁

### 为什么显式定义 EntryTag？

Prisma 支持隐式多对多（`Entry tags Tag[]` + `Tag entries Entry[]`），但那样 Prisma 会自动管理关联表，你对它没有控制权。

显式定义 EntryTag 的好处：
1. **精确控制级联删除**：删除 Entry 时自动删除所有 EntryTag 关联；删除 Tag 时同样。
2. **未来扩展性**：以后可能需要给关联加元数据（比如 `taggedAt`：什么时候打的标签），有显式表就可以直接加字段。

### 为什么用复合主键 @@id([entryId, tagId])？

同一个 Entry 不能绑定同一个 Tag 两次。复合主键天然保证这一点。

### 为什么级联删除？

- Entry 删除 → 关联的 EntryTag 自动删除（没人需要孤立的关联记录）
- Tag 删除 → 关联的 EntryTag 自动删除（Entry 本身不受影响）

---

## 五、Asset：解耦的附件

### 为什么 Asset 独立存在？

Asset 不是 Entry 的一部分，它是依附于 Entry 的独立实体。

原因：
1. **一个 Asset 可以被多个 Entry 引用**（虽然 MVP 不实现，但 Schema 预留了这种可能）
2. **Asset 可以脱离 Entry 存在**（独立上传，后续再关联）
3. **方便未来扩展**：相册视图、附件管理、媒体库——这些功能需要独立查询 Asset 表

### 为什么 entryId 可为空？

支持"先上传后关联"的流程：
1. 用户在编辑器中粘贴图片 → Asset 创建，entryId 暂时为空
2. 用户保存 Entry → Asset 的 entryId 更新为 Entry 的 id

### 为什么 onDelete: SetNull（而非 Cascade）？

删除 Entry 时，Asset 不自动删除。

理由：用户删除了一条记录，但里面的图片可能在其他地方有价值。先保留 Asset，未来可以做"孤立 Asset 清理"。

### 为什么没有 width / height / duration？

这些是媒体元数据，属于 Phase 2 (v0.3) 图片系统。
MVP 只需要"这张图片叫什么、存在哪、多大"即可。

---

## 六、content 与 contentMd 双存储详解

这是整个架构中最容易被误解的设计。单独一节说明。

### 问题

编辑器（TipTap）需要一个数据结构来精确描述"这段文字是加粗的、那张图片在第三段后面、这个地方有个分割线"。

最简单的方式是 JSON。TipTap 原生输出 JSON。

但 JSON 有两个致命问题：
1. **不可搜索**：`{"type":"paragraph","content":[{"type":"text","text":"今天去了东京"}]}` 中搜索"东京"——技术上可行，但慢且不准确。
2. **不可导出**：如果五年后你想把所有内容导出为可读文件，JSON 几乎没用。

### 方案

每次保存时，同时写入两个字段：

```
content   ← TipTap JSON（编辑器精确还原）
contentMd ← Markdown（搜索 + 导出）
```

转换发生在应用层（`lib/markdown.ts`），不在数据库层。

### 为什么不是 HTML？

HTML 也有类似问题：搜索困难、导出不优雅、体积大。
Markdown 是纯文本，可读性强，可以直接用全文搜索。

### 如果两个字段不一致怎么办？

以 `content`（TipTap JSON）为准。`contentMd` 是派生字段。

如果发现不一致——例如因为 Bug 导致 Markdown 转换失败——从 content 重新生成 contentMd。

---

## 七、从 SQLite 迁移到 PostgreSQL 的路径

当前使用 SQLite，未来可能切换 PostgreSQL。

### 需要改什么

1. `prisma/schema.prisma`：
   ```diff
   - provider = "sqlite"
   + provider = "postgresql"
   ```

2. `.env`：
   ```diff
   - DATABASE_URL="file:./dev.db"
   + DATABASE_URL="postgresql://user:pass@host:5432/digital_garden"
   ```

3. `type` 字段（可选优化）：
   ```prisma
   // 可以改为 PostgreSQL 原生 enum:
   type EntryType @default(Memory)
   ```

### 不需要改什么

- 所有模型结构保持不变
- 所有关系保持不变
- Prisma Client API 保持不变
- 应用层代码零修改

### 为什么设计可以平滑迁移

- 所有 ID 使用 String（cuid），不依赖数据库自增序列
- 没有使用 SQLite 特有的 SQL 语法
- Prisma 是数据库无关的 ORM

---

## 八、Schema 结构图

```
┌─────────────────────────────────┐
│            Entry                 │
│─────────────────────────────────│
│ id          String   @id        │
│ title       String              │
│ slug        String   @unique    │
│ type        String              │  ← Memory|Thought|Emotion|Dream|Story|Learning
│ content     String              │  ← TipTap JSON
│ contentMd   String              │  ← Markdown
│ excerpt     String?             │
│ isPrivate   Boolean  @default   │
│ createdAt   DateTime @default   │
│ updatedAt   DateTime @updatedAt │
│                                 │
│ @@index([type])                 │
│ @@index([createdAt])            │
└──────────┬──────────────────────┘
           │
           │ 1:N (Entry.assets)
           ▼
┌─────────────────────────────────┐
│            Asset                 │
│─────────────────────────────────│
│ id          String   @id        │
│ url         String              │
│ fileName    String              │
│ fileSize    Int                 │
│ mimeType    String              │
│ entryId     String?             │
│ entry       Entry?              │
│ createdAt   DateTime @default   │
│                                 │
│ @@index([entryId])              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│            Entry                 │
└──────────┬──────────────────────┘
           │
           │ M:N (Entry.tags)
           ▼
┌─────────────────────────────────┐
│          EntryTag                │
│─────────────────────────────────│
│ entryId     String   (PK)       │
│ tagId       String   (PK)       │
│ entry       Entry               │  ← onDelete: Cascade
│ tag         Tag                 │  ← onDelete: Cascade
│                                 │
│ @@id([entryId, tagId])          │
└──────────┬──────────────────────┘
           │
           │ M:N (Tag.entries)
           ▼
┌─────────────────────────────────┐
│            Tag                   │
│─────────────────────────────────│
│ id          String   @id        │
│ name        String   @unique    │
│ slug        String   @unique    │
└─────────────────────────────────┘
```

---

## 九、Entry.type：String vs Enum 分析

### 当前实现

Entry.type 使用 `String` 类型，在应用层（Server Actions）校验合法值。

```prisma
// prisma/schema.prisma
model Entry {
  type String  // Memory | Thought | Emotion | Dream | Story | Learning
}
```

校验常量定义在应用代码中（`lib/constants.ts` 或类似位置）：

```typescript
export const ENTRY_TYPES = [
  "Memory",
  "Thought",
  "Emotion",
  "Dream",
  "Story",
  "Learning",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];
```

### 为什么用 String

**优点**：

1. **SQLite 兼容**：Prisma 5 + SQLite 不支持 enum 语法。使用 String 是 SQLite 上的唯一选择。
2. **数据库无关**：不绑定特定数据库的 enum 实现。迁移到 PostgreSQL 时无需修改 Schema。
3. **简单透明**：数据库中看到的就是 `"Memory"`，不是数字索引。直接用 SQL 查询也直观。
4. **灵活**：未来增加新类型（如 `Travel`、`Health`）不需要执行数据库迁移（`ALTER TYPE ... ADD VALUE` 在 PostgreSQL 中有一定复杂度）。

**缺点**：

1. 没有数据库层约束。一个 Bug 可能写入 `"memry"`（拼写错误）而不会被拒绝。
2. 存储空间略大（`"Learning"` = 8 bytes vs enum = 4 bytes）。对 MVP 可忽略。
3. 如果不在应用层校验，脏数据会被静默写入。

### 如果用 Enum（PostgreSQL）

**优点**：

1. 数据库层强约束：不可能写入非法类型值。
2. 存储效率高（4 bytes）。
3. Prisma Client 生成的 TypeScript 类型更精确。

**缺点**：

1. 增加新类型需要 `ALTER TYPE ... ADD VALUE`，在事务和回滚中有注意事项。
2. SQLite 不支持，导致开发/测试环境与生产环境不一致。
3. 迁移到 PostgreSQL 原生 enum 后，如果要切换回 SQLite 会很痛苦。

### PostgreSQL 迁移时的影响

当从 SQLite 切换到 PostgreSQL 时，有两种选择：

**选择 A：保持 String，不改为 Enum**

- ✅ 零迁移成本
- ✅ 开发/生产环境一致
- ❌ 失去数据库层约束
- **推荐**：如果应用层校验已经足够可靠

**选择 B：改为 PostgreSQL 原生 Enum**

```sql
CREATE TYPE "EntryType" AS ENUM (
  'Memory', 'Thought', 'Emotion',
  'Dream', 'Story', 'Learning'
);
ALTER TABLE "Entry" ALTER COLUMN "type" TYPE "EntryType" USING "type"::"EntryType";
```

- ✅ 数据库层强约束
- ❌ 迁移复杂度
- ❌ 开发环境（SQLite）与生产不一致
- **可选**：如果数据完整性要求极高

### 结论

**MVP 保持 String。** 应用层校验即可覆盖风险。即使未来迁移到 PostgreSQL，也没有强烈理由改为 Enum——String 方式工作得足够好，且更灵活。

---

## 十、Future Considerations

以下字段和模型在 ARCHITECTURE.md 中定义，但不在当前 Schema 中。记录于此供未来参考。

### Entry 未来可能增加的字段

| 字段 | 何时加入 | 用途 |
|------|---------|------|
| `coverImage` | Phase 2 (v0.3) | 封面图 URL |
| `galleryImages` | Phase 2 (v0.3) | 多图（JSON 数组） |
| `tendedAt` | Phase 3+ | 花园打理时间 |
| `deletedAt` | 需要软删除时 | 回收站 |

### Asset 未来可能增加的字段

| 字段 | 何时加入 | 用途 |
|------|---------|------|
| `width` | Phase 2 (v0.3) | 图片宽度 |
| `height` | Phase 2 (v0.3) | 图片高度 |
| `thumbnail` | Phase 2 (v0.3) | 缩略图 URL（列表卡片用） |
| `duration` | 音频/视频支持 | 媒体时长 |
| `type` | 需要区分附件类型时 | 图片/音频/视频/文件 |

### 未来可能增加的模型

| 模型 | 何时加入 | 用途 |
|------|---------|------|
| User | 部署到公网时 | 密码保护 |
| Link | Phase 7 (v0.8) | Wikilink + Backlinks |
| EntryVersion | Phase 6 (v0.7) | 历史版本快照 |

---

> **设计原则回顾**：每张表、每个字段都回答一个问题。
>
> 如果某个字段回答不了"它帮助用户更好地记录、回顾或成长吗"，它就不应该存在。
