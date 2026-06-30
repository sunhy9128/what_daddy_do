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

export type CourseCategory = '喂养' | '护理' | '抚触' | '睡眠' | '早教' | '急救';

const COURSE_CATEGORIES: CourseCategory[] = ['喂养', '护理', '抚触', '睡眠', '早教', '急救'];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  stages: PregnancyStage[];
  type: 'video' | 'article';
  duration?: string;
  content: string;
  tips?: string[];
}

const SAMPLE_COURSES: Course[] = [
  {
    id: '1',
    title: '新手爸爸必学：如何正确抱宝宝',
    description: '新生儿颈部无力，抱姿不对容易伤害宝宝。这节课教你三种正确抱姿，从摇篮式到竖抱，让宝宝安全又舒适。',
    category: '护理',
    stages: ['first', 'second', 'third', 'postpartum'],
    type: 'video',
    duration: '8分钟',
    content: `## 摇篮式抱法（0-3个月首选）

这是最适合新生儿的抱姿，宝宝像在摇篮里一样舒适。

**步骤：**
1. 用一只手托住宝宝的头部和颈部
2. 另一只手托住宝宝的背部和臀部
3. 将宝宝贴近你的胸部，让宝宝的头靠在你的肘弯处

## 竖抱法（2个月以上）

喝完奶后拍嗝必备，但时间不宜过长。

**要点：**
- 宝宝的下巴靠在你的肩膀上
- 一只手支撑宝宝的臀部
- 另一只手保护宝宝的后脑勺
- 每次竖抱不超过10分钟

## 橄榄球式抱法（适合喂奶）

这种抱法特别适合剖腹产妈妈，也可以用于哄睡。

**技巧：**
- 宝宝身体夹在你的腋下
- 宝宝的脸朝向你的方向
- 手臂托住宝宝的身体`,
    tips: ['抱宝宝前先洗手', '动作要轻柔，避免摇晃', '早产儿请咨询医生后再竖抱'],
  },
  {
    id: '2',
    title: '宝宝哭闹怎么办？5步快速安抚法',
    description: '宝宝哭闹是有原因的！学会这5步，从检查基本需求到创造安全感，快速让宝宝安静下来。',
    category: '护理',
    stages: ['third', 'postpartum'],
    type: 'article',
    content: `## 宝宝哭闹的5步排查法

### 第1步：检查生理需求
- 饿了？检查上次喂奶时间
- 尿了？检查尿布是否需要更换
- 困了？观察宝宝的睡眠信号

### 第2步：给予身体舒适
- 轻轻按摩宝宝的腹部（顺时针）
- 抱着宝宝走动，轻微摇晃
- 检查宝宝是否太热或太冷

### 第3步：创造安全感
- 把宝宝包裹紧一些（但不要过热）
- 抱着贴近你的胸口
- 轻声说话或哼摇篮曲

### 第4步：转移注意力
- 用黑白卡吸引宝宝注意
- 轻轻摇晃拨浪鼓
- 带宝宝换个环境

### 第5步：寻求帮助
- 如果宝宝持续哭闹超过1小时
- 伴随发热、呕吐等症状
- 及时就医`,
    tips: ['记录宝宝的哭闹时间规律', '爸爸的声音有独特的安抚作用', '妈妈不在时宝宝可能更需要安抚'],
  },
  {
    id: '3',
    title: '新生儿抚触全教程（图解）',
    description: '抚触不仅能促进宝宝生长发育，还能增进亲子感情。跟着图解一步步学，每天10分钟，宝宝更聪明。',
    category: '抚触',
    stages: ['postpartum'],
    type: 'video',
    duration: '12分钟',
    content: `## 抚触前的准备

**环境要求：**
- 室温26-28度
- 播放轻柔的背景音乐
- 宝宝清醒但不饿

**用品准备：**
- 婴儿按摩油（温热后使用）
- 柔软的毛巾
- 宝宝舒适地躺在柔软的垫子上

## 抚触步骤

### 1. 脸部抚触
用拇指从额头中央向外轻轻画圈

### 2. 胸部抚触
双手放在宝宝胸口，从中间向两侧轻轻推开

### 3. 腹部抚触
顺时针画圈，帮助宝宝排气

### 4. 四肢抚触
从大腿到脚踝，轻轻揉捏

### 5. 背部抚触
让宝宝趴着，从颈部向臀部方向轻抚`,
    tips: ['选择宝宝状态好的时候进行', '观察宝宝反应，抵触时停止', '抚触是爸爸陪玩的好时机'],
  },
  {
    id: '4',
    title: '换尿布不再手忙脚乱',
    description: '给新手爸爸的尿布更换教程，从选择尿布尺寸到男女宝宝不同技巧，一次学会不再慌。',
    category: '护理',
    stages: ['third', 'postpartum'],
    type: 'video',
    duration: '6分钟',
    content: `## 尿布更换步骤

### 准备物品
- 干净的纸尿裤
- 湿巾或棉柔巾
- 护臀膏
- 隔尿垫

### 更换流程
1. 铺好隔尿垫，把宝宝放上去
2. 解开脏尿布，用湿巾从前向后擦拭
3. 抬起宝宝双腿，抽出脏尿布
4. 清洁后，给宝宝涂上护臀膏
5. 穿上新尿布，注意不要太紧

### 男女宝宝差异
- 男宝宝：特别注意生殖器周围的清洁
- 女宝宝：从前往后擦，避免感染`,
    tips: ['尿布两侧有防侧漏边，要拉出来', '脐带未脱落时，尿布要折叠露出脐带', '喂奶前检查尿布，减少吐奶风险'],
  },
  {
    id: '5',
    title: '如何给新生儿拍嗝',
    description: '宝宝喝完奶后总是胀气？学会这3种拍嗝方法，有效预防吐奶和肠绞痛。',
    category: '喂养',
    stages: ['postpartum'],
    type: 'video',
    duration: '5分钟',
    content: `## 为什么需要拍嗝

宝宝吃奶时会吞入空气，不拍出来会导致：
- 吐奶
- 胀气
- 肠绞痛

## 三种拍嗝方法

### 方法1：竖抱拍嗝（最常用）
1. 宝宝竖直抱起
2. 让宝宝的头靠在你肩上
3. 用空心掌轻拍宝宝背部
4. 听到"嗝"声就成功了

### 方法2：坐姿拍嗝
1. 让宝宝坐在你腿上
2. 一只手支撑宝宝下巴
3. 另一只手轻拍背部

### 方法3：俯卧拍嗝
1. 宝宝趴在你的大腿上
2. 头部略高于身体
3. 轻拍背部`,
    tips: ['喂奶中途也要拍嗝', '拍嗝时间10-15分钟为宜', '听到轻微的"咯"声即可'],
  },
  {
    id: '6',
    title: '爸爸也能做婴儿排气操',
    description: '每天5分钟排气操，解决宝宝胀气、便秘问题。跟着做，宝宝肚子舒服，睡得更香。',
    category: '抚触',
    stages: ['postpartum'],
    type: 'article',
    content: `## 排气操的好处

- 帮助宝宝排出肠道气体
- 缓解肠绞痛
- 促进消化
- 增进亲子互动

## 排气操步骤

### 1. 膝盖顶腹
让宝宝仰卧，弯曲膝盖轻轻顶向腹部

### 2. 双腿蹬车
交替弯曲和伸直宝宝的双腿，像蹬自行车一样

### 3. 顺时针揉腹
用手指在宝宝腹部顺时针画圈

### 4. 手膝交叉
让宝宝的右手碰左膝，左手碰右膝

### 5. 轻柔翻身
让宝宝轻轻侧身，保持几秒

## 注意事项
- 喂奶后30分钟再做
- 动作要轻柔
- 宝宝哭闹时停止`,
    tips: ['宝宝哭闹加剧要立即停止', '每天做2-3次效果更好', '配合温敷效果更佳'],
  },
  {
    id: '7',
    title: '备孕攻略：准爸爸的准备清单',
    description: '备孕不只是妈妈的事！从饮食到生活习惯，准爸爸要知道这些准备，提高受孕几率。',
    category: '早教',
    stages: ['preconception'],
    type: 'article',
    content: `## 备孕，爸爸也要努力！

很多人以为备孕只是妈妈的事，其实准爸爸的健康同样重要。

## 准爸爸备孕清单

### 1. 健康检查
- 精液检查
- 传染病筛查
- 遗传疾病咨询

### 2. 营养补充
- 叶酸：每天400微克
- 锌：提高精子质量
- 维生素E：改善精子活力

### 3. 生活习惯
- 戒烟戒酒
- 避免泡温泉、蒸桑拿
- 减少熬夜
- 适当运动

### 4. 环境注意
- 避免接触有害化学物质
- 减少久坐
- 避免穿紧身裤

### 5. 心理准备
- 和妻子一起学习育儿知识
- 做好角色转换的心理准备
- 规划好工作与家庭的平衡`,
    tips: ['至少提前3个月开始准备', '保持愉快的心情很重要', '夫妻一起备孕成功率更高'],
  },
  {
    id: '8',
    title: '新生儿呛奶急救法',
    description: '呛奶是新生儿常见的危险情况。学会这个急救方法，关键时刻能救宝宝一命！',
    category: '急救',
    stages: ['postpartum'],
    type: 'video',
    duration: '4分钟',
    content: `## 呛奶的预防

- 喂奶不要过快过急
- 保持宝宝半卧位
- 喂奶后拍嗝
- 不要让宝宝平躺喝奶

## 呛奶急救步骤

### 轻度呛奶（宝宝能哭泣）
1. 立即将宝宝侧卧
2. 用手帕清理口腔
3. 轻拍背部
4. 观察宝宝呼吸

### 严重呛奶（宝宝不能呼吸）
1. 俯卧拍背
2. 用力拍打肩胛骨中间
3. 清理口腔异物
4. 立即拨打急救电话

## 预防是关键
呛奶往往发生在宝宝月龄小的时候，家长要时刻警惕。`,
    tips: ['收藏这篇文章，关键时刻有用', '发现异常立即就医', '不要用力摇晃宝宝'],
  },
  {
    id: '9',
    title: '0-3个月宝宝发展指南',
    description: '每个月宝宝都有新技能！了解宝宝的发育里程碑，及时发现发育问题。',
    category: '早教',
    stages: ['postpartum'],
    type: 'article',
    content: `## 0-3个月宝宝发育里程碑

### 1个月
- 能注视眼前物体
- 对声音有反应
- 俯卧时能抬头1-2秒

### 2个月
- 会微笑
- 能追视移动的物体
- 发出咕咕声

### 3个月
- 能抬头至45度
- 手能抓握东西
- 能识别妈妈的声音

## 爸爸可以做的事

- 和宝宝说话
- 练习追视
- 帮助宝宝抬头
- 读简单的黑白卡

## 需要注意的信号

如果宝宝出现以下情况，建议咨询医生：
- 3个月不能抬头
- 对声音没有反应
- 不会注视人脸`,
    tips: ['每个宝宝发育节奏不同，不必过度比较', '多趴着玩有助于大动作发展', '定期体检很重要'],
  },
  {
    id: '10',
    title: '职场爸爸如何平衡育儿与工作',
    description: '陪产假结束后，如何在工作和家庭之间找到平衡？这些实用建议帮你成为称职的职场爸爸。',
    category: '早教',
    stages: ['preconception', 'first', 'second', 'third', 'postpartum'],
    type: 'article',
    content: `## 职场爸爸的时间管理

### 早起的高质量陪伴
- 早起30分钟，专心陪玩
- 一起吃早餐
- 出门前给宝宝一个拥抱

### 下班后的专属时间
- 设置"手机勿扰"时间
- 全心投入陪玩1-2小时
- 参与日常护理（洗澡、喂饭）

### 周末家庭日
- 制定每周家庭计划
- 减少加班
- 参与宝宝的早教活动

## 沟通技巧

### 与妻子的分工
- 提前讨论育儿分工
- 不要默认妻子应该承担更多
- 主动询问能帮什么

### 与老板的沟通
- 说明育儿需求
- 提高工作效率
- 合理利用陪产假

## 心理调节

- 接受自己会犯错
- 不要追求完美爸爸
- 保持自己的兴趣爱好`,
    tips: ['质量比时间更重要', '让宝宝知道爸爸永远爱他', '照顾好自己才能照顾好宝宝'],
  },
];

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
    title: { ...typography.largeTitle, fontWeight: '700', color: colors.fg },
    subtitle: { ...typography.callout, color: colors.muted, marginTop: spacing.xs },
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
          <Text style={styles.title}>育儿课程</Text>
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
