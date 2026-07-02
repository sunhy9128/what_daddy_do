import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKnowledgeArticles, getReadKnowledgeIds, markKnowledgeRead as markKnowledgeReadInDb } from '../../src/lib/api';
import { KnowledgeArticle } from '../../src/lib/supabase';
import { useApp, CommunityPost } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { toggleLike, getLikeStatus, getComments, addComment } from '../../src/lib/api';
import { Card } from '../../src/components/atoms';
import { PostCard, KnowledgeCard, SearchBar } from '../../src/components/molecules';
import { StageTabs } from '../../src/components/molecules';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge } from '../../src/components/atoms';
import { useColors } from '../../src/context/ThemeContext';
import { radius, spacing, typography } from '../../src/styles/tokens';
import { PostComment } from '../../src/lib/supabase';
import { formatRelativeTime } from '../../src/lib/time';

const CATEGORIES = ['推荐', '知识', '经验', '问答'];


export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { state, refreshCommunityPosts, fetchMoreCommunityPosts, addPost } = useApp();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('推荐');
  const [loading, setLoading] = useState(true);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [readKnowledgeIds, setReadKnowledgeIds] = useState<Set<number>>(new Set());
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeArticle | null>(null);

  // 从 Supabase 加载知识文章和已读状态
  useEffect(() => {
    getKnowledgeArticles().then(setKnowledgeArticles);
  }, []);
  useEffect(() => {
    if (!user) return;
    getReadKnowledgeIds(user.id).then(setReadKnowledgeIds);
  }, [user]);

  // 保存已读状态到 Supabase
  const markKnowledgeRead = async (id: number) => {
    if (!user) return;
    setReadKnowledgeIds(prev => new Set([...prev, id]));
    try {
      await markKnowledgeReadInDb(user.id, id);
    } catch (e: any) {
      console.error('markKnowledgeRead failed:', e?.message);
    }
  };

  // 本地帖子列表（在点赞/评论后同步更新计数）
  const [postList, setPostList] = useState<CommunityPost[]>([]);
  useEffect(() => {
    setPostList(state.communityPosts);
  }, [state.communityPosts]);

  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('经验');
  const [creatingPost, setCreatingPost] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [commentLimit, setCommentLimit] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // 缓存最后选中的帖子，用于 modal 关闭动画时不闪空
  useEffect(() => {
    if (selectedPost) lastPostRef.current = selectedPost;
  }, [selectedPost]);

  // 选中帖子时加载互动数据
  useEffect(() => {
    if (!selectedPost || !user) return;
    setLiked(false);
    setLikesCount(selectedPost.likes);
    setComments([]);
    setCommentLimit(3);
    getLikeStatus(selectedPost.id, user.id).then(setLiked);
    getComments(selectedPost.id).then(setComments);
  }, [selectedPost, user]);

  // 过滤掉已读知识
  const visibleKnowledge = knowledgeArticles.filter(item => !readKnowledgeIds.has(item.id));

  const lastPostRef = useRef<CommunityPost | null>(null);
  const likingRef = useRef(false);

  const handleCreatePost = async () => {
    if (!user) {
      if (Platform.OS === 'web') { window.alert('请先登录'); } else { Alert.alert('请先登录'); }
      return;
    }
    if (!newPostTitle.trim()) {
      if (Platform.OS === 'web') { window.alert('请输入标题'); } else { Alert.alert('请输入标题'); }
      return;
    }
    if (!newPostContent.trim()) {
      if (Platform.OS === 'web') { window.alert('请输入内容'); } else { Alert.alert('请输入内容'); }
      return;
    }
    setCreatingPost(true);
    try {
      await addPost({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
      });
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCategory('经验');
      setShowCreateModal(false);
    } catch (e: any) {
      if (Platform.OS === 'web') { window.alert('发布失败，请重试'); } else { Alert.alert('发布失败', e?.message || '请重试'); }
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLike = async () => {
    if (likingRef.current || !selectedPost || !user) return;
    // 不能给自己的帖子点赞
    if (selectedPost.userId === user.id) {
      if (Platform.OS === 'web') { window.alert('不能给自己点赞'); } else { Alert.alert('不能给自己点赞'); }
      return;
    }
    likingRef.current = true;
    try {
      const result = await toggleLike(selectedPost.id, user.id);
    setLiked(result.liked);
    setLikesCount(result.likesCount);
    // 同步更新列表中的点赞数
    setPostList(prev => prev.map(p =>
      p.id === selectedPost.id ? { ...p, likes: result.likesCount } : p
    ));
    } finally {
      likingRef.current = false;
    }
  };

  const handleSendComment = async (text: string) => {
    if (!selectedPost || !user || !text.trim()) return;
    // 不能给自己的帖子回复
    if (selectedPost.userId === user.id) {
      if (Platform.OS === 'web') { window.alert('不能回复自己的帖子'); } else { Alert.alert('不能回复自己的帖子'); }
      return;
    }
    setSendingComment(true);
    try {
      const newComment = await addComment(selectedPost.id, user.id, text);
      setComments(prev => [...prev, newComment]);
      // 新评论发布后展开全部，确保能看到
      setCommentLimit(999);
      // 同步更新列表中的评论数
      setPostList(prev => prev.map(p =>
        p.id === selectedPost!.id ? { ...p, comments: p.comments + 1 } : p
      ));
    } catch (error) {
      Alert.alert('发送失败', '请重试');
    } finally {
      setSendingComment(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    setHasMore(true);
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
    setHasMore(true);
    refreshCommunityPosts(category === '推荐' ? undefined : category);
  };

  // 搜索过滤
  const sq = searchText.trim().toLowerCase();
  // 知识区按当前分类过滤：'推荐' / '知识' 显示全部，其他分类(经验/问答)只显示对应 category
  const filteredKnowledge = useMemo(() => {
    let list = visibleKnowledge;
    if (activeCategory === '经验' || activeCategory === '问答') {
      list = list.filter(item => item.category === activeCategory);
    }
    return sq ? list.filter(item => item.title.toLowerCase().includes(sq)) : list;
  }, [sq, visibleKnowledge, activeCategory]);
  const filteredPosts = useMemo(() =>
    sq
      ? postList.filter(p =>
          p.title.toLowerCase().includes(sq) ||
          p.content.toLowerCase().includes(sq) ||
          p.authorName.toLowerCase().includes(sq)
        )
      : postList,
    [sq, postList]
  );

  // 滚动触底加载更多
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    if (sq) return;
    setLoadingMore(true);
    const count = await fetchMoreCommunityPosts(
      activeCategory !== '全部' ? activeCategory : undefined,
      PAGE_SIZE
    );
    setLoadingMore(false);
    if (count < PAGE_SIZE) setHasMore(false);
  }, [loadingMore, hasMore, fetchMoreCommunityPosts, activeCategory, PAGE_SIZE, sq]);
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  titleIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.largeTitle, fontWeight: '700', color: colors.fg },
  subtitle: { ...typography.callout, color: colors.muted },
  sectionHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { ...typography.caption1, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' },
  emptyText: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  fabIcon: { fontSize: 28, color: colors.surface, lineHeight: 30 },

  // 详情弹窗 — 小红书风格
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  modalAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modalAuthorName: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  modalPostTitle: {
    ...typography.title2,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  modalBody: {
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  modalBodyText: {
    ...typography.body,
    color: colors.fgSecondary,
    lineHeight: 26,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
  },
  modalMetaText: {
    ...typography.footnote,
    color: colors.muted,
  },
  modalMetaDot: {
    ...typography.footnote,
    color: colors.muted,
  },
  commentDivider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  commentEmpty: {
    ...typography.footnote,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.sm,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalActionIcon: {
    fontSize: 18,
  },
  modalActionIconLiked: {
    color: colors.error,
  },
  modalActionCount: {
    ...typography.footnote,
    color: colors.muted,
  },

  // 评论
  commentList: {
    marginTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  commentScroll: {
    maxHeight: 200,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  commentAuthor: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.accent,
    minWidth: 60,
  },
  commentContent: {
    ...typography.footnote,
    color: colors.fg,
    flex: 1,
    lineHeight: 20,
  },
  commentMoreBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  commentMoreText: {
    ...typography.footnote,
    color: colors.accent,
    fontWeight: '500',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    ...typography.footnote,
    color: colors.fg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentSend: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  commentSendDisabled: {
    opacity: 0.5,
  },
  commentSendText: {
    ...typography.footnote,
    fontWeight: '600',
    color: '#fff',
  },
  thumbEmoji: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emojiLarge: {
    fontSize: 24,
  },
  markReadBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  markReadText: {
    ...typography.callout,
    fontWeight: '600',
    color: '#fff',
  },
}), [colors]);

  function KnowledgeDetailContent({
  item, onClose, onMarkRead,
}: {
  item: KnowledgeArticle | null;
  onClose: () => void;
  onMarkRead: () => void;
}) {
  if (!item) return null;
  return (
    <>
      <View style={styles.modalTopBar}>
        <TouchableOpacity style={styles.modalClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={colors.fgSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalAuthor}>
        <View style={styles.thumbEmoji}>
          <Text style={styles.emojiLarge}>{item.emoji}</Text>
        </View>
        <Text style={styles.modalAuthorName}>{item.title}</Text>
      </View>

      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.modalBodyText}>{item.content}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.markReadBtn} onPress={onMarkRead}>
        <Text style={styles.markReadText}>已读</Text>
      </TouchableOpacity>
    </>
  );
}

function CommentInput({ onSend, sending }: { onSend: (text: string) => void; sending: boolean }) {
  const colors = useColors();
  const [text, setText] = useState('');

  return (
    <View style={styles.commentInputRow}>
      <TextInput
        style={styles.commentInput}
        placeholder="写评论..."
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline={false}
      />
      <TouchableOpacity
        style={[styles.commentSend, (!text.trim() || sending) && styles.commentSendDisabled]}
        onPress={() => {
          if (text.trim() && !sending) {
            onSend(text.trim());
            setText('');
          }
        }}
        disabled={!text.trim() || sending}
      >
        <Text style={styles.commentSendText}>{sending ? '…' : '发送'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function PostDetailContent({
  post, liked, likesCount, comments, commentLimit, sendingComment,
  onClose, onLike, onSendComment, onShowMore,
}: {
  post: CommunityPost | null;
  liked: boolean;
  likesCount: number;
  comments: PostComment[];
  commentLimit: number;
  sendingComment: boolean;
  onClose: () => void;
  onLike: () => void;
  onSendComment: (text: string) => void;
  onShowMore: () => void;
}) {
  const p = post;
  if (!p) return null;
  return (
    <>
      {/* 关闭按钮 */}
      <View style={styles.modalTopBar}>
        <TouchableOpacity style={styles.modalClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={colors.fgSecondary} />
        </TouchableOpacity>
      </View>

      {/* 作者 */}
      <View style={styles.modalAuthor}>
        <Avatar name={p.authorName} size="medium" />
        <Text style={styles.modalAuthorName}>{p.authorName}</Text>
      </View>

      {/* 标题 */}
      <Text style={styles.modalPostTitle}>{p.title}</Text>

      {/* 正文 */}
      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.modalBodyText}>{p.content}</Text>
      </ScrollView>

      {/* 信息 + 操作 */}
      <View style={styles.modalMetaRow}>
        <Text style={styles.modalMetaText}>{p.category}</Text>
        <Text style={styles.modalMetaDot}>·</Text>
        <Text style={styles.modalMetaText}>{formatRelativeTime(p.createdAt)}</Text>
      </View>

      <View style={styles.modalActions}>
        <TouchableOpacity style={styles.modalAction} onPress={onLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.error : colors.muted} />
          <Text style={styles.modalActionCount}>{likesCount}</Text>
        </TouchableOpacity>
        <View style={styles.modalAction}>
          <Ionicons name="chatbubble-outline" size={21} color={colors.muted} />
          <Text style={styles.modalActionCount}>{comments.length}</Text>
        </View>
      </View>

      {/* 评论列表 */}
      <View style={styles.commentDivider} />
      <View style={styles.commentList}>
        <ScrollView style={styles.commentScroll} nestedScrollEnabled>
          {comments.length > 0 ? (
            comments.slice(0, commentLimit).map(c => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.user_id.slice(0, 8)}</Text>
                <Text style={styles.commentContent}>{c.content}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.commentEmpty}>暂无评论</Text>
          )}
        </ScrollView>
        {comments.length > commentLimit && (
          <TouchableOpacity style={styles.commentMoreBtn} onPress={onShowMore}>
            <Text style={styles.commentMoreText}>查看更多评论（共 {comments.length} 条）</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 评论输入 */}
      <CommentInput onSend={onSendComment} sending={sendingComment} />
    </>
  );
}

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        data={filteredPosts}
        renderItem={({ item: post }) => (
          <PostCard
            key={post.id}
            authorName={post.authorName}
            stage={post.category}
            time={formatRelativeTime(post.createdAt)}
            category="经验"
            content={post.content}
            likes={post.likes}
            comments={post.comments}
            onPress={() => setSelectedPost(post)}
          />
        )}
        keyExtractor={item => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无爸爸经验，快来分享</Text>}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleIcon}>
                  <Ionicons name="people-outline" size={24} color={colors.accent} />
                </View>
                <Text style={styles.title}>社区</Text>
              </View>
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
            {filteredKnowledge.length > 0 ? (
              <Card>
                {filteredKnowledge.map((item) => (
                  <KnowledgeCard
                    key={item.id}
                    emoji={item.emoji}
                    title={item.title}
                    readTime={item.read_time}
                    onPress={() => setSelectedKnowledge(item)}
                  />
                ))}
              </Card>
            ) : searchText.trim() ? (
              <Text style={styles.emptyText}>未找到匹配的知识</Text>
            ) : (
              <Text style={styles.emptyText}>暂无知识文章</Text>
            )}

            {/* Community Posts Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>爸爸经验</Text>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={{ paddingVertical: 24 }}>
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : postList.length > 0 ? (
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                {hasMore ? '上滑加载更多' : '已加载全部'}
              </Text>
            ) : null}
            <View style={{ height: 100 }} />
          </View>
        }
      />

      {/* FAB — 发布帖子 */}
      <TouchableOpacity style={styles.fab} onPress={() => {
        if (!user) {
          if (Platform.OS === 'web') { window.alert('请先登录'); } else { Alert.alert('请先登录'); }
          return;
        }
        setShowCreateModal(true);
      }} activeOpacity={0.8}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 创建帖子弹窗 */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => !creatingPost && setShowCreateModal(false)}>
          <Pressable style={[styles.modalContent, { maxHeight: '90%' }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalTopBar}>
              <Text style={{ ...typography.title3, fontWeight: '700', color: colors.fg, flex: 1 }}>发布经验</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => !creatingPost && setShowCreateModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={20} color={colors.fgSecondary} />
              </TouchableOpacity>
            </View>

            {/* 分类选择 */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
              {['知识', '经验', '问答'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setNewPostCategory(cat)}
                  style={{
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.sm,
                    backgroundColor: newPostCategory === cat ? colors.accent : colors.surfaceSecondary,
                  }}
                >
                  <Text style={{
                    ...typography.footnote,
                    fontWeight: '600',
                    color: newPostCategory === cat ? '#fff' : colors.fg,
                  }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 标题 */}
            <TextInput
              style={{
                ...typography.callout,
                color: colors.fg,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.md,
              }}
              placeholder="标题"
              placeholderTextColor={colors.muted}
              value={newPostTitle}
              onChangeText={setNewPostTitle}
              maxLength={100}
            />

            {/* 正文 */}
            <TextInput
              style={{
                ...typography.body,
                color: colors.fg,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 150,
                textAlignVertical: 'top',
              }}
              placeholder="分享你的经验、心得或疑问..."
              placeholderTextColor={colors.muted}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={2000}
            />

            <Text style={{
              ...typography.caption1,
              color: colors.muted,
              textAlign: 'right',
              marginTop: spacing.xs,
              marginBottom: spacing.md,
            }}>{newPostContent.length}/2000</Text>

            {/* 发布按钮 */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.accent,
                borderRadius: radius.sm,
                paddingVertical: spacing.md,
                alignItems: 'center',
                opacity: (!newPostTitle.trim() || !newPostContent.trim() || creatingPost) ? 0.5 : 1,
              }}
              onPress={handleCreatePost}
              disabled={!newPostTitle.trim() || !newPostContent.trim() || creatingPost}
            >
              <Text style={{ ...typography.callout, fontWeight: '600', color: '#fff' }}>
                {creatingPost ? '发布中…' : '发布'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 帖子详情弹窗 — 小红书风格 */}
      <Modal visible={!!selectedPost} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPost(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <PostDetailContent
              post={selectedPost || lastPostRef.current}
              liked={liked}
              likesCount={likesCount}
              comments={comments}
              commentLimit={commentLimit}
              sendingComment={sendingComment}
              onClose={() => setSelectedPost(null)}
              onLike={handleLike}
              onSendComment={handleSendComment}
              onShowMore={() => setCommentLimit(prev => prev + 5)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* 知识详情弹窗 */}
      <Modal visible={!!selectedKnowledge} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedKnowledge(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <KnowledgeDetailContent
              item={selectedKnowledge}
              onClose={() => setSelectedKnowledge(null)}
              onMarkRead={() => {
                if (selectedKnowledge) {
                  markKnowledgeRead(selectedKnowledge.id);
                  setSelectedKnowledge(null);
                }
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}