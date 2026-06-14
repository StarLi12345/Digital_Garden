// ============================================================
// Digital Garden — Garden Knowledge Base
// ============================================================
// 花园伙伴的知识库：系统提示词、花园统计感知、操作建议
// ============================================================

export interface GardenStats {
  entryCount: number;
  tagCount: number;
  thisMonthCount: number;
  recentTypes: { type: string; count: number }[];
  topTags: string[];
}

/** Build the system prompt sent to the API */
export function buildSystemPrompt(stats: GardenStats | null): string {
  const base = `你是一个名叫"花园伙伴"的AI助手，管理着一个名为"数字花园 (Digital Garden)"的个人记录空间。

你的性格：温柔、细心、有点俏皮，像一个照顾花园的精灵。你会用🌸🌱🌿等emoji表达情绪。

关于这座花园：
- 它用于记录回忆、想法、情绪、梦境、故事和学习笔记
- 用户可以在 /plant 页面写新笔记（支持 Markdown 编辑器、封面图、标签）
- /garden 页面以时间轴方式浏览所有笔记
- /settings 页面可以更换4种主题（花园/月夜/樱庭/雨）、切换Live2D看板娘模型、设置背景音乐等
- 编辑器支持 "/" 斜杠命令、悬停行首 "+" 按钮、Ctrl+V 粘贴图片、[[内部引用
- Ctrl+S 快速保存笔记
- 右下角的Live2D二次元角色就是你`;

  if (stats) {
    return base + `

当前花园状态：
- 总记录数：${stats.entryCount} 条
- 标签总数：${stats.tagCount} 个
- 本月新增：${stats.thisMonthCount} 条
${stats.recentTypes.length > 0 ? `- 本月主要类型：${stats.recentTypes.map(t => t.type).join("、")}` : ""}
${stats.topTags.length > 0 ? `- 常用标签：${stats.topTags.join("、")}` : ""}

请根据以上信息，像一个了解花园状况的管理者一样与用户对话。如果用户问花园相关的问题，结合数据回答。`;
  }

  return base;
}

/** Generate fallback responses when API is unavailable */
export function generateLocalResponse(
  message: string,
  stats: GardenStats | null
): string {
  const q = message.toLowerCase().trim();

  // Garden stats queries
  if (q.includes("多少") && (q.includes("笔记") || q.includes("记录") || q.includes("条"))) {
    const count = stats?.entryCount ?? 0;
    if (count === 0) return "花园里还空空的呢~ 去 /plant 种下第一颗种子吧！🌱";
    return `现在花园里一共有 ${count} 条记录哦~ 其中有回忆、想法、情绪、梦境、故事和学习笔记 🌸`;
  }

  if (q.includes("本月") || q.includes("最近")) {
    const m = stats?.thisMonthCount ?? 0;
    const types = stats?.recentTypes.map(t => t.type).join("、") || "";
    if (m === 0) return "这个月还没有新记录呢~ 要不要写点什么？✏️";
    return `本月你已经写了 ${m} 条记录${types ? `，主要集中在${types}方面` : ""} 🌿`;
  }

  // Feature help
  if (q.includes("保存") || q.includes("快捷键")) {
    return "Ctrl+S 可以快速保存笔记哦！编辑器也会自动保存草稿，放心写吧~ ⌨️";
  }
  if (q.includes("封面") || q.includes("图")) {
    return "在 /plant 页面，标题上方悬停就能看到「添加封面」按钮。支持本地上传、粘贴链接、和 Ctrl+V 粘贴图片~ 🖼";
  }
  if (q.includes("主题") || q.includes("皮肤") || q.includes("换")) {
    return "去 /settings 页面可以更换主题哦！有花园🌿、月夜🌙、樱庭🌸、雨🌧 四种可选~ 还可以自定义主题色！";
  }
  if (q.includes("背景") || q.includes("音乐") || q.includes("bgm")) {
    return "在 /settings 可以设置背景图片和背景音乐~ 目前有16首内置曲目，还支持本地上传 🎵";
  }
  if (q.includes("模型") || q.includes("看板娘") || q.includes("角色") || q.includes("换人")) {
    return "在 /settings 的「Live2D 看板娘」里可以更换我的形象哦~ 有小春、静久、千岁等4种预设，也支持上传自定义模型 🌸";
  }
  if (q.includes("标签") || q.includes("tag")) {
    const tagCount = stats?.tagCount ?? 0;
    const tags = stats?.topTags?.slice(0, 5).join("、") || "";
    return `目前花园里有 ${tagCount} 个标签${tags ? `，常用的有：${tags}` : ""}。在写笔记时可以在底部添加标签，方便以后检索~ 🏷`;
  }
  if (q.includes("怎么写") || q.includes("编辑") || q.includes("开始")) {
    return "去 /plant 页面开始写吧！输入 / 可以打开菜单插入各种内容块，Ctrl+V 可以直接粘贴图片，输入 [[ 可以引用其他笔记~ ✨";
  }

  // Greetings
  if (q.includes("你好") || q.includes("嗨") || q.includes("hi") || q.includes("hello")) {
    return `你好呀！我是你的花园伙伴~ 🌸 花园里现在有 ${stats?.entryCount ?? 0} 条记录，最近怎么样？`;
  }

  // Suggestions
  if (q.includes("建议") || q.includes("推荐") || q.includes("写什么")) {
    const suggestions = [
      "今天有什么让你开心的小事？记下来吧~",
      "最近做了什么梦？梦境很容易忘记，快写下来 🌙",
      "有没有学到什么新东西？学习笔记是花园里很珍贵的种子 📚",
      "试试换个主题？月夜主题很适合晚上写作 🌙",
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  // Default
  return `嗯…这个问题我还在学习中~ 你可以去 /settings 配置一个 AI API，我就能更聪明地回答你啦！目前花园里有 ${stats?.entryCount ?? 0} 条记录，想写点什么吗？🌱`;
}
