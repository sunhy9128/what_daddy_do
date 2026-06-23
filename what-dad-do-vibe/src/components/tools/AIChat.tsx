import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { LoadingDot } from './ToolBase';
import {
  ChatMessage,
  buildSystemPrompt,
  getApiKey,
  sendChatMessage,
  BabyContext,
} from '../../lib/ai-chat';
import { calculateStageFromDueDate, PregnancyStage } from '../../lib/stages';

// ─── 阶段建议问题 ───
const STAGE_SUGGESTIONS: Record<string, { q: string; label: string }[]> = {
  preconception: [
    { q: '备孕期爸爸需要做什么准备？', label: '爸爸准备' },
    { q: '备孕期饮食有什么注意事项？', label: '饮食建议' },
  ],
  first: [
    { q: '孕早期爸爸可以怎样照顾妈妈？', label: '照顾妈妈' },
    { q: '孕早期需要注意什么？', label: '注意事项' },
    { q: '早孕反应很严重怎么办？', label: '早孕反应' },
  ],
  second: [
    { q: '孕中期可以做哪些运动？', label: '孕期运动' },
    { q: '胎教应该怎么做？', label: '胎教建议' },
    { q: '孕中期产检有哪些项目？', label: '产检项目' },
  ],
  third: [
    { q: '孕晚期爸爸应该准备什么？', label: '爸爸准备' },
    { q: '怎么判断是否要生了？', label: '临产信号' },
    { q: '待产包里需要装什么？', label: '待产包' },
  ],
  postpartum: [
    { q: '新生儿护理要注意什么？', label: '新生儿护理' },
    { q: '爸爸怎么帮妈妈坐好月子？', label: '月子照顾' },
    { q: '宝宝黄疸怎么办？', label: '黄疸应对' },
  ],
};

// ─── 欢迎消息 ───
const WELCOME_MESSAGES: Record<string, string> = {
  preconception: '你好！我是你的孕期陪护助手 🤝\n\n备孕期是打好基础的关键阶段，有什么想问的吗？',
  first: '你好！我是你的孕期陪护助手 🤝\n\n恭喜进入孕早期！这个阶段妈妈可能会有早孕反应，爸爸的陪伴很重要哦。有什么想了解的？',
  second: '你好！我是你的孕期陪护助手 🤝\n\n孕中期是相对舒适的阶段，可以多陪妈妈散步、做胎教。有什么想聊的？',
  third: '你好！我是你的孕期陪护助手 🤝\n\n进入孕晚期啦！准备工作要做好，随时关注妈妈的身体变化。有什么问题尽管问！',
  postpartum: '你好！我是你的孕期陪护助手 🤝\n\n宝宝出生了，恭喜你当爸爸啦！育儿之路刚刚开始，有疑问随时找我！',
};

export function AIChat({ expanded, babyGender }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { state } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  // 构建宝宝上下文
  const babyCtx = useMemo<BabyContext>(() => {
    const baby = state.babies.find(b => b.id === state.currentBabyId);
    if (!baby) return {};
    const { stage, weeksPregnant, stageLabel } = baby.dueDate
      ? calculateStageFromDueDate(baby.dueDate)
      : { stage: undefined as PregnancyStage | undefined, weeksPregnant: undefined, stageLabel: undefined };
    return {
      stage: stage || state.stage,
      stageLabel,
      weeksPregnant,
      dueDate: baby.dueDate,
      birthDate: baby.birthDate || undefined,
      babyName: baby.name,
      gender: baby.gender || babyGender,
    };
  }, [state.babies, state.currentBabyId, state.stage, babyGender]);

  const currentStage = babyCtx.stage || state.stage || 'preconception';
  const suggestions = STAGE_SUGGESTIONS[currentStage] || STAGE_SUGGESTIONS.preconception;

  // 初始显示欢迎消息
  useEffect(() => {
    if (!initialized) {
      setMessages([{
        role: 'assistant',
        content: WELCOME_MESSAGES[currentStage] || WELCOME_MESSAGES.preconception,
      }]);
      setInitialized(true);
    }
  }, [initialized, currentStage]);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // 发送消息
  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInputText('');
    setError('');

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('未配置 API Key。请在 .env 文件中设置 EXPO_PUBLIC_DEEPSEEK_API_KEY');
      }

      // 构建 system prompt（只在首次请求时携带，或每次重新构建）
      const systemPrompt = buildSystemPrompt(babyCtx);
      const systemMsg: ChatMessage = { role: 'system', content: systemPrompt };

      const reply = await sendChatMessage(apiKey, [
        systemMsg,
        ...updatedMessages,
      ]);

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      const errMsg = e?.message || '请求失败，请检查网络连接后重试';
      setError(errMsg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${errMsg}\n\n你可以稍后再试。`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, babyCtx]);

  // ─── Styles ───
  const styles = useMemo(() => StyleSheet.create({
    container: {
      maxHeight: expanded ? 560 : 480,
      flex: 1,
    },
    chatList: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    msgRow: {
      marginBottom: spacing.sm,
      flexDirection: 'row',
    },
    msgRowUser: {
      justifyContent: 'flex-end',
    },
    msgBubble: {
      maxWidth: '80%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
    },
    msgUser: {
      backgroundColor: colors.accent,
      borderBottomRightRadius: 4,
    },
    msgUserText: {
      color: '#fff',
      ...typography.footnote,
      lineHeight: 20,
    },
    msgAssistant: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
      ...shadows.sm,
    },
    msgAssistantText: {
      color: colors.fg,
      ...typography.footnote,
      lineHeight: 20,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    loadingText: {
      ...typography.caption2,
      color: colors.muted,
    },
    // ─── 建议问题 ───
    suggestionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    suggestChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.full,
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestChipText: {
      ...typography.caption2,
      color: colors.accent,
      fontWeight: '500',
    },
    // ─── 输入区 ───
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      backgroundColor: colors.bg,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.footnote,
      color: colors.fg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: colors.surfaceSecondary,
    },
    sendBtnText: {
      color: '#fff',
      fontSize: 16,
    },
    // ─── 空状态 ───
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    emptyText: {
      ...typography.body,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.xl,
    },
  }), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            <View style={[
              styles.msgBubble,
              msg.role === 'user' ? styles.msgUser : styles.msgAssistant,
            ]}>
              <Text style={msg.role === 'user' ? styles.msgUserText : styles.msgAssistantText}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <LoadingDot delay={0} />
            <LoadingDot delay={150} />
            <LoadingDot delay={300} />
            <Text style={styles.loadingText}>思考中…</Text>
          </View>
        )}
      </ScrollView>

      {/* 快捷建议问题 */}
      {!loading && messages.length <= 1 && (
        <View style={styles.suggestionsWrap}>
          {suggestions.slice(0, 3).map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestChip}
              onPress={() => handleSend(s.q)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestChipText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 输入区 */}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入你的问题…"
          placeholderTextColor={colors.muted}
          multiline
          onSubmitEditing={() => handleSend(inputText)}
          blurOnSubmit
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim() || loading}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default AIChat;
