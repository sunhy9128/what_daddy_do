// DeepSeek AI 问答 — API 调用层
// 供 AIChat 工具组件使用，不直接依赖 UI

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BabyContext {
  stage?: string;
  stageLabel?: string;
  weeksPregnant?: number;
  dueDate?: string;
  birthDate?: string;
  babyName?: string;
  gender?: string;
}

/**
 * 构建个性化 System Prompt
 * 基于宝宝/孕期信息让 AI 的回答更有针对性
 */
export function buildSystemPrompt(ctx: BabyContext): string {
  const parts: string[] = [
    '你是一个温暖、专业的孕期陪护助手，专门帮助准爸爸和新手爸爸。',
    '',
    '回答原则：',
    '- 用简洁易懂的中文，避免过于学术化',
    '- 始终站在"爸爸"的角度给出建议（比如爸爸可以怎样支持妈妈、爸爸可以做什么准备）',
    '- 如果用户问到医疗问题，先给出常识建议，再提醒"建议咨询医生"',
    '- 保持温暖鼓励的语气',
    '- 回答控制在 200 字以内，除非用户要求详细说明',
  ];

  if (ctx.stage && ctx.stageLabel) {
    parts.push('', `当前阶段：${ctx.stageLabel}。`);
    if (ctx.stage !== 'postpartum' && ctx.weeksPregnant !== undefined) {
      parts.push(`当前孕周：${ctx.weeksPregnant}周。`);
    }
  }

  if (ctx.babyName) {
    parts.push(`宝宝名字：${ctx.babyName}。`);
  }

  if (ctx.gender) {
    const label = ctx.gender === 'male' ? '男宝宝' : ctx.gender === 'female' ? '女宝宝' : ctx.gender;
    parts.push(`宝宝性别：${label}。`);
  }

  if (ctx.stage === 'postpartum' && ctx.birthDate) {
    parts.push('宝宝已出生，侧重解答育儿相关问题。');
  }

  parts.push('', '请根据以上信息，有针对性地回答准爸爸的问题。');

  return parts.join('\n');
}

/**
 * 获取 API Key
 * 优先从 process.env 读取（Expo 自动加载 .env），
 * 若构建环境不可用则 fallback 到空字符串（运行时用户需自行配置）
 */
export function getApiKey(): string {
  return process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY
    || process.env.DEEPSEEK_API_KEY
    || '';
}

/**
 * 发送聊天消息到 DeepSeek API
 * 非流式调用，返回完整回答文本
 */
export async function sendChatMessage(
  apiKey: string,
  messages: ChatMessage[],
): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`DeepSeek API 请求失败 (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek API 返回数据异常：无回答内容');
  }
  return content;
}
