import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { getCommunityPosts, getKnowledgeArticles } from '../../lib/api';
import { CommunityPost, KnowledgeArticle } from '../../lib/supabase';
import { StageTabs } from '../../components/StageTabs';
import { colors, spacing, fontSize, radius } from '../../styles/tokens';

const TABS = ['推荐', '知识', '经验', '问答'];

export default function Community() {
  const [activeTab, setActiveTab] = useState('推荐');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeArticle[]>([]);

  useEffect(() => {
    getCommunityPosts().then(setPosts);
    getKnowledgeArticles().then(setKnowledge);
  }, []);

  const visibleKnowledge =
    activeTab === '经验' || activeTab === '问答'
      ? knowledge.filter(k => k.category === activeTab)
      : knowledge;

  return (
    <View style={{ padding: `${spacing.lg}rpx`, backgroundColor: colors.bg, minHeight: '100vh' }}>
      <StageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {(activeTab === '推荐' || activeTab === '知识') && visibleKnowledge.length > 0 && (
        <View style={{ marginBottom: `${spacing.md}rpx` }}>
          <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.sm}rpx`, display: 'block' }}>
            知识文章
          </Text>
          {visibleKnowledge.slice(0, 3).map(item => (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: `${radius.md}rpx`,
                padding: `${spacing.md}rpx`,
                borderWidth: '1rpx',
                borderColor: colors.border,
                marginBottom: `${spacing.sm}rpx`,
              }}
            >
              <Text style={{ fontSize: `${fontSize.callout}rpx`, color: colors.fg }}>
                {item.emoji} {item.title}
              </Text>
              <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.fgSecondary, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
                {item.read_time}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={{ fontSize: `${fontSize.callout}rpx`, fontWeight: '600', color: colors.fg, marginBottom: `${spacing.sm}rpx`, display: 'block' }}>
        帖子
      </Text>
      {posts.length === 0 ? (
        <Text style={{ color: colors.fgSecondary, fontSize: `${fontSize.body}rpx`, textAlign: 'center', padding: `${spacing.xl}rpx` }}>
          暂无帖子
        </Text>
      ) : (
        posts.map(post => (
          <View
            key={post.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: `${radius.md}rpx`,
              padding: `${spacing.md}rpx`,
              borderWidth: '1rpx',
              borderColor: colors.border,
              marginBottom: `${spacing.sm}rpx`,
            }}
          >
            <Text style={{ fontSize: `${fontSize.body}rpx`, color: colors.fg, display: 'block' }}>
              {post.content}
            </Text>
            <Text style={{ fontSize: `${fontSize.footnote}rpx`, color: colors.muted, marginTop: `${spacing.xs}rpx`, display: 'block' }}>
              ♥ {post.likes_count} · 💬 {post.comments_count}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}