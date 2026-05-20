import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/atoms';
import { PostCard, KnowledgeCard, SearchBar } from '../../src/components/molecules';
import { StageTabs } from '../../src/components/molecules';
import { colors, spacing, typography } from '../../src/styles/tokens';

const CATEGORIES = ['推荐', '知识', '经验', '问答'];
const KNOWLEDGE_ITEMS = [
  { emoji: '🫁', title: '准爸爸必看：孕26-28周该做什么' },
  { emoji: '👶', title: '宝宝胎动怎么数？准爸爸必会技能' },
  { emoji: '🏥', title: '待产包清单：准爸爸打包指南' },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { state, refreshCommunityPosts } = useApp();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('推荐');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      await refreshCommunityPosts(activeCategory === '推荐' ? undefined : activeCategory);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    refreshCommunityPosts(category === '推荐' ? undefined : category);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>社区</Text>
          <Text style={styles.subtitle}>知识 + 爸爸经验</Text>
        </View>

        {/* Search */}
        <SearchBar
          placeholder="搜索知识/经验..."
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Categories */}
        <StageTabs
          stages={CATEGORIES}
          activeStage={activeCategory}
          onStageChange={handleCategoryChange}
        />

        {/* Knowledge Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>热门知识</Text>
        </View>
        <Card>
          {KNOWLEDGE_ITEMS.map((item, index) => (
            <KnowledgeCard
              key={index}
              emoji={item.emoji}
              title={item.title}
              readTime={index === 0 ? '3分钟阅读' : index === 1 ? '5分钟阅读' : '4分钟阅读'}
            />
          ))}
        </Card>

        {/* Community Posts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>爸爸经验</Text>
        </View>
        {state.communityPosts.slice(0, 5).map(post => (
          <PostCard
            key={post.id}
            authorName={post.authorName}
            stage={post.category}
            time="最近"
            category="经验"
            content={post.content}
            likes={post.likes}
            comments={post.comments}
          />
        ))}
        {state.communityPosts.length === 0 && (
          <Text style={styles.emptyText}>暂���爸爸经验，快来分享</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  title: { ...typography.largeTitle, fontWeight: '700' },
  subtitle: { ...typography.callout, color: colors.muted, marginTop: spacing.xs },
  sectionHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { ...typography.caption1, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' },
  emptyText: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
});