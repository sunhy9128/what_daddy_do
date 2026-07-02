import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useAuth } from '../../context/AuthContext';
import { getBabies } from '../../lib/api';
import { Baby } from '../../lib/supabase';
import { calculateStageFromDueDate } from '../../lib/stages';
import { colors, spacing, fontSize } from '../../styles/tokens';

interface ChatMsg { role: 'user' | 'ai'; content: string; }

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = 'YOUR-DEEPSEEK-API-KEY';

export default function AI() {
  const { user } = useAuth();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getBabies(user.id).then(b => setBaby(b[0] ?? null));
  }, [user]);

  const stage = baby ? calculateStageFromDueDate(baby.due_date) : null;
  const systemPrompt = `你是「爸爸去哪了」的 AI 助手，专为准爸爸/新手爸爸解答孕产育儿问题。${
    baby ? `用户宝宝名叫「${baby.name}」` : '用户尚未填写宝宝信息'
  }${stage ? `，当前阶段：${stage.stage}（孕 ${stage.weeksPregnant} 周）` : ''}。回答简洁（≤200字），用中文，必要时给到具体可执行建议。`;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await Taro.request({
        url: DEEPSEEK_URL,
        method: 'POST',
        header: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
        data: {
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: systemPrompt }, ...next],
          max_tokens: 500,
        },
      });
      const reply = res.data?.choices?.[0]?.message?.content ?? '抱歉，AI 暂时没回复。';
      setMessages([...next, { role: 'ai', content: reply }]);
    } catch (e) {
      Taro.showToast({ title: '请求失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Text style={{ fontSize: `${fontSize.title}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.md}rpx`, display: 'block' }}>
        🤖 AI 问答
      </Text>

      <ScrollView
        scrollY
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: `${spacing.md}rpx` }}
      >
        {messages.length === 0 ? (
          <View style={{ padding: `${spacing.xl}rpx`, alignItems: 'center' }}>
            <Text style={{ fontSize: '64rpx' }}>🤖</Text>
            <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg, marginTop: `${spacing.md}rpx` }}>
              问我任何孕产育儿问题
            </Text>
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, textAlign: 'center' }}>
              {baby ? `已为 ${baby.name} 定制回答` : '尚未填写宝宝信息'}
            </Text>
          </View>
        ) : (
          messages.map((m, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: `${spacing.sm}rpx`,
              }}
            >
              <View
                style={{
                  maxWidth: '80%',
                  backgroundColor: m.role === 'user' ? colors.accent : colors.surface,
                  color: m.role === 'user' ? '#FFFFFF' : colors.fg,
                  padding: `${spacing.sm}rpx ${spacing.md}rpx`,
                  borderRadius: `${radius.md}rpx`,
                  borderWidth: m.role === 'user' ? '0' : '2rpx',
                  borderColor: colors.border,
                }}
              >
                <Text style={{
                  color: m.role === 'user' ? '#FFFFFF' : colors.fg,
                  fontSize: `${fontSize.body}rpx`,
                  lineHeight: '1.5',
                }}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))
        )}
        {loading && (
          <View style={{ alignItems: 'flex-start', marginBottom: `${spacing.sm}rpx` }}>
            <View style={{ backgroundColor: colors.surface, padding: `${spacing.sm}rpx ${spacing.md}rpx`, borderRadius: `${radius.md}rpx`, borderWidth: '2rpx', borderColor: colors.border }}>
              <Text style={{ color: colors.fgSecondary, fontSize: `${fontSize.footnote}rpx` }}>正在思考…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: `${spacing.md}rpx` }}>
        <Input
          value={input}
          onInput={(e: any) => setInput(e.detail.value)}
          onConfirm={send}
          placeholder="说点什么…"
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: `${radius.md}rpx`,
            borderWidth: '2rpx',
            borderColor: colors.border,
            padding: `${spacing.sm}rpx`,
            fontSize: `${fontSize.body}rpx`,
            marginRight: `${spacing.sm}rpx`,
          }}
        />
        <Button
          onClick={send}
          loading={loading}
          style={{ backgroundColor: colors.accent, color: '#FFFFFF', borderRadius: `${radius.md}rpx`, fontSize: `${fontSize.footnote}rpx` }}
        >
          发送
        </Button>
      </View>
    </View>
  );
}