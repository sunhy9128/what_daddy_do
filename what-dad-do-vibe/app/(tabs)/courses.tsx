import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/atoms';
import { StageTabs } from '../../src/components/molecules';
import { useColors } from '../../src/context/ThemeContext';
import { radius, spacing, typography } from '../../src/styles/tokens';
import { STAGE_LABELS, PregnancyStage } from '../../src/lib/stages';

const STAGE_LABEL_LIST = Object.values(STAGE_LABELS);

import { COURSE_CATEGORIES, SAMPLE_COURSES, Course, CourseCategory } from '../../src/lib/courses-data';


export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [selectedStage, setSelectedStage] = useState<string>(STAGE_LABELS.postpartum);
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | '全部'>('全部');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const currentStageKey = useMemo(() => {
    const entry = Object.entries(STAGE_LABELS).find(([, label]) => label === selectedStage);
    return entry ? (entry[0] as PregnancyStage) : 'postpartum';
  }, [selectedStage]);

  const filteredCourses = useMemo(() => {
    return SAMPLE_COURSES.filter(course => {
      const matchStage = course.stages.includes(currentStageKey);
      const matchCategory = selectedCategory === '全部' || course.category === selectedCategory;
      return matchStage && matchCategory;
    });
  }, [currentStageKey, selectedCategory]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
    titleIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.largeTitle, fontWeight: '700', color: colors.fg },
    subtitle: { ...typography.callout, color: colors.muted },
    stageTabs: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    categoryScroll: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceSecondary,
      marginRight: spacing.xs,
    },
    categoryChipActive: {
      backgroundColor: colors.accent,
    },
    categoryTxt: { ...typography.footnote, color: colors.muted },
    categoryTxtActive: { ...typography.footnote, color: '#fff', fontWeight: '600' },
    courseList: { paddingHorizontal: spacing.lg },
    courseCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    courseThumb: {
      height: 120,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    courseThumbIcon: { fontSize: 40, color: colors.accent },
    courseBody: { padding: spacing.md },
    courseTitle: { ...typography.callout, fontWeight: '600', color: colors.fg, marginBottom: spacing.xs },
    courseDesc: { ...typography.footnote, color: colors.fgSecondary, lineHeight: 18, marginBottom: spacing.sm },
    courseMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    courseTag: {
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    courseTagTxt: { ...typography.footnote, color: colors.accent, fontWeight: '500' },
    courseDuration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    courseDurationTxt: { ...typography.footnote, color: colors.muted },
    emptyCourse: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
    emptyCourseIcon: { marginBottom: spacing.md },
    emptyCourseTxt: { ...typography.callout, color: colors.muted },
    // Detail modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    modalTitle: { ...typography.callout, fontWeight: '600', color: colors.fg, flex: 1 },
    modalCloseBtn: { padding: spacing.xs },
    modalScroll: { padding: spacing.lg },
    modalCourseTitle: { ...typography.title1, fontWeight: '700', color: colors.fg, marginBottom: spacing.sm },
    modalCourseMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    modalCourseDesc: { ...typography.callout, color: colors.fgSecondary, lineHeight: 22, marginBottom: spacing.lg },
    modalSectionTitle: { ...typography.callout, fontWeight: '600', color: colors.fg, marginBottom: spacing.sm },
    modalContentText: { ...typography.callout, color: colors.fg, lineHeight: 24 },
    tipCard: {
      backgroundColor: colors.accentLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    tipTitle: { ...typography.footnote, fontWeight: '600', color: colors.accent, marginBottom: spacing.xs },
    tipTxt: { ...typography.footnote, color: colors.accent },
  });

  const handleCoursePress = (course: Course) => {
    setSelectedCourse(course);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="play-circle-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.title}>育儿课程</Text>
          </View>
          <Text style={styles.subtitle}>跟着视频和文章，轻松学会带娃</Text>
        </View>

        {/* 阶段筛选 */}
        <View style={styles.stageTabs}>
          <StageTabs
            stages={STAGE_LABEL_LIST}
            activeStage={selectedStage}
            onStageChange={setSelectedStage}
          />
        </View>

        {/* 分类筛选 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === '全部' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('全部')}
          >
            <Text style={selectedCategory === '全部' ? styles.categoryTxtActive : styles.categoryTxt}>全部</Text>
          </TouchableOpacity>
          {COURSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={selectedCategory === cat ? styles.categoryTxtActive : styles.categoryTxt}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 课程列表 */}
        <View style={styles.courseList}>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.courseCard} onPress={() => handleCoursePress(course)} activeOpacity={0.7}>
                <View style={styles.courseThumb}>
                  <Ionicons name={course.type === 'video' ? 'play-circle' : 'document-text'} size={40} color={colors.accent} />
                </View>
                <View style={styles.courseBody}>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                  <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                  <View style={styles.courseMeta}>
                    <View style={styles.courseTag}>
                      <Text style={styles.courseTagTxt}>{course.category}</Text>
                    </View>
                    {course.duration && (
                      <View style={styles.courseDuration}>
                        <Ionicons name="time-outline" size={12} color={colors.muted} />
                        <Text style={styles.courseDurationTxt}>{course.duration}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCourse}>
              <Ionicons name="school-outline" size={48} color={colors.muted} style={styles.emptyCourseIcon} />
              <Text style={styles.emptyCourseTxt}>该阶段暂无相关课程</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 课程详情 Modal */}
      <Modal visible={!!selectedCourse} animationType="slide" transparent onRequestClose={() => setSelectedCourse(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedCourse?.title}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedCourse(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color={colors.fgSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalCourseTitle}>{selectedCourse?.title}</Text>
              <View style={styles.modalCourseMeta}>
                <View style={styles.courseTag}>
                  <Text style={styles.courseTagTxt}>{selectedCourse?.category}</Text>
                </View>
                {selectedCourse?.duration && (
                  <View style={styles.courseDuration}>
                    <Ionicons name="time-outline" size={12} color={colors.muted} />
                    <Text style={styles.courseDurationTxt}>{selectedCourse?.duration}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.modalCourseDesc}>{selectedCourse?.description}</Text>
              <Text style={styles.modalSectionTitle}>内容</Text>
              <Text style={styles.modalContentText}>{selectedCourse?.content}</Text>
              {selectedCourse?.tips && selectedCourse.tips.length > 0 && (
                <View style={styles.tipCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs }}>
                    <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                    <Text style={styles.tipTitle}>小贴士</Text>
                  </View>
                  {selectedCourse.tips.map((tip, i) => (
                    <Text key={i} style={styles.tipTxt}>• {tip}</Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
