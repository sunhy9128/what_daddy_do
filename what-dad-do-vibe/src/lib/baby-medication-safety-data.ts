// 婴儿用药安全参考数据
// 针对 0-6 岁婴幼儿常见疾病用药
// 仅供参考，具体用药请遵医嘱

export interface BabyMedication {
  id: string;
  name: string;
  brandNames?: string[];
  category: string;
  form?: string;        // 剂型
  ageRanges: {
    baby_0_3m: 'safe' | 'caution' | 'forbidden';
    baby_3_12m: 'safe' | 'caution' | 'forbidden';
    baby_1_3y: 'safe' | 'caution' | 'forbidden';
    baby_3_6y: 'safe' | 'caution' | 'forbidden';
  };
  note: string;
  dosageNote?: string;  // 剂量参考
}

export const BABY_MEDICATION_DATA: BabyMedication[] = [
  // ─── 退热/止痛 ───
  {
    id: 'baby_acetaminophen',
    name: '对乙酰氨基酚（婴幼儿用）',
    brandNames: ['泰诺林', '百服咛', 'Panadol'],
    category: '退热止痛',
    form: '滴剂/混悬液/栓剂',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '婴幼儿退热首选。3个月以下宝宝必须在医生指导下使用。注意计算体重剂量(10-15mg/kg/次)，4-6小时一次，24h不超过4次。',
    dosageNote: '按体重10-15mg/kg/次，每4-6小时一次',
  },
  {
    id: 'baby_ibuprofen',
    name: '布洛芬（婴幼儿用）',
    brandNames: ['美林', 'Motrin', 'Advil'],
    category: '退热止痛',
    form: '滴剂/混悬液/栓剂',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '6个月以上婴幼儿可用。退热效果强于对乙酰氨基酚，但胃肠刺激较大。饭后服用，脱水/呕吐时慎用。',
    dosageNote: '按体重5-10mg/kg/次，每6-8小时一次',
  },
  {
    id: 'baby_nimesulide',
    name: '尼美舒利',
    brandNames: [],
    category: '退热止痛',
    form: '颗粒/混悬液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'forbidden', baby_3_6y: 'caution' },
    note: '❌ 禁用于12岁以下儿童！可致严重肝损伤。已在多国禁用或限制使用。',
  },
  {
    id: 'baby_aspirin',
    name: '阿司匹林（儿童用）',
    brandNames: ['巴米尔'],
    category: '退热止痛',
    form: '片剂',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'forbidden', baby_3_6y: 'forbidden' },
    note: '❌ 儿童禁用！病毒感染时使用可能诱发瑞氏综合征（Reye Syndrome），可致死或致严重脑损伤。',
  },

  // ─── 感冒/鼻塞 ───
  {
    id: 'baby_saline_nose',
    name: '生理性海水喷鼻剂',
    brandNames: ['小海豚', '菲丝摩尔', '生理盐水鼻喷'],
    category: '感冒鼻塞',
    form: '鼻喷雾',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '婴幼儿鼻塞的优先选择。安全无副作用，可随时使用。软化鼻痂、湿润鼻腔。新生儿可用。',
  },
  {
    id: 'baby_acetylcysteine',
    name: '乙酰半胱氨酸',
    brandNames: ['富露施', '痰易净'],
    category: '感冒鼻塞',
    form: '颗粒/泡腾片',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '祛痰药。2岁以下需医生指导。哮喘患儿慎用。',
  },
  {
    id: 'baby_ambroxol',
    name: '氨溴索',
    brandNames: ['沐舒坦', '贝莱'],
    category: '感冒鼻塞',
    form: '口服液/糖浆',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '祛痰药。1岁以下婴儿慎用（组织胺释放可能导致支气管痉挛）。需在医生指导下使用。',
  },
  {
    id: 'baby_pseudoephedrine',
    name: '伪麻黄碱（儿童剂型）',
    brandNames: ['艾畅(含)'],
    category: '感冒鼻塞',
    form: '口服液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'caution', baby_3_6y: 'caution' },
    note: '6岁以下不推荐使用含伪麻黄碱的复方感冒药。副作用包括兴奋、失眠、心率加快。',
  },
  {
    id: 'baby_chlorpheniramine',
    name: '氯苯那敏（儿童）',
    brandNames: ['扑尔敏'],
    category: '感冒鼻塞',
    form: '片剂/口服液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'caution', baby_3_6y: 'safe' },
    note: '第一代抗组胺药。2岁以下需医生指导。有嗜睡副作用，注意观察。',
  },

  // ─── 咳嗽 ───
  {
    id: 'baby_honey',
    name: '蜂蜜（食疗）',
    brandNames: [],
    category: '咳嗽',
    form: '食疗',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '⚠️ 1岁以下婴儿绝对禁止食用蜂蜜！有肉毒杆菌中毒风险。1岁以上可食用，2.5-5ml蜂蜜对夜咳有缓解作用。',
  },
  {
    id: 'baby_dextromethorphan',
    name: '右美沙芬',
    brandNames: ['惠菲宁(含)'],
    category: '咳嗽',
    form: '口服液/糖浆',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'caution', baby_3_6y: 'safe' },
    note: '中枢性镇咳药。2岁以下禁用。4岁以下不推荐。仅用于干咳，有痰时不要使用。',
  },
  {
    id: 'baby_acetylcysteine_cough',
    name: '乙酰半胱氨酸（儿童）',
    brandNames: ['富露施'],
    category: '咳嗽',
    form: '颗粒剂',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '祛痰药，稀释痰液。1岁以下在医生指导下使用。',
  },

  // ─── 腹泻/消化 ───
  {
    id: 'baby_oral_rehydration',
    name: '口服补液盐Ⅲ',
    brandNames: ['博叶', 'ORSⅢ'],
    category: '腹泻消化',
    form: '散剂',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '腹泻时防脱水的首选！按说明书冲调，少量多次喂服。新生儿也可使用。不要用自制糖盐水代替。',
    dosageNote: '根据体重计算：50-100ml/kg，少量多次喂养',
  },
  {
    id: 'baby_probiotics',
    name: '益生菌（婴儿用）',
    brandNames: ['亿活', '妈咪爱', '合生元', 'Culturelle'],
    category: '腹泻消化',
    form: '散剂/滴剂',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '腹泻、便秘、肠绞痛辅助治疗。选用婴幼儿专用菌株。水温不超过40℃，避免和抗生素同服。',
  },
  {
    id: 'baby_smectite',
    name: '蒙脱石散',
    brandNames: ['思密达', '必奇', '肯特令'],
    category: '腹泻消化',
    form: '散剂',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '物理性止泻药，不进入血液循环。饭前服用，与其他药物间隔1-2小时。新生儿可用。',
  },
  {
    id: 'baby_lactase',
    name: '乳糖酶',
    brandNames: ['儿歌', '爱宝'],
    category: '腹泻消化',
    form: '滴剂/散剂',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '乳糖不耐受引起的腹泻（尤其是腹泻后乳糖酶缺乏）。母乳喂养时滴入宝宝口中，配方奶可混入奶液。',
  },
  {
    id: 'baby_simethicone',
    name: '西甲硅油',
    brandNames: ['Gas-X', '小葫芦'],
    category: '腹泻消化',
    form: '滴剂',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '肠绞痛辅助用药。物理消泡作用，不被吸收。可缓解腹部胀气。',
  },
  {
    id: 'baby_loperamide',
    name: '洛哌丁胺',
    brandNames: ['易蒙停', 'Imodium'],
    category: '腹泻消化',
    form: '胶囊/口服液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'forbidden', baby_3_6y: 'caution' },
    note: '❌ 5岁以下儿童禁用！可能引起肠麻痹、嗜睡等严重副作用。',
  },

  // ─── 便秘 ───
  {
    id: 'baby_glycerin',
    name: '开塞露/甘油栓',
    brandNames: ['开塞露'],
    category: '便秘',
    form: '直肠用',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '临时缓解便秘。不要长期使用以免形成依赖。使用时剪短管口，涂抹润滑后轻柔插入。3个月以下小婴儿需医生指导。',
  },
  {
    id: 'baby_lactulose',
    name: '乳果糖口服液',
    brandNames: ['杜密克'],
    category: '便秘',
    form: '口服液',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '婴幼儿便秘安全用药。几乎不吸收，温和调节。新生儿可用。从低剂量开始，按反应调整。',
    dosageNote: '1-6月：2.5-5ml/日；7-12月：5ml/日；1-6岁：5-10ml/日',
  },

  // ─── 皮肤护理 ───
  {
    id: 'baby_zinc_oxide',
    name: '氧化锌软膏',
    brandNames: ['氧化锌软膏', 'Desitin'],
    category: '皮肤护理',
    form: '软膏/护臀膏',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '尿布疹的基础护理。每次换尿布时涂抹，形成保护膜隔离刺激物。含40%氧化锌的配方效果更好。',
  },
  {
    id: 'baby_bepanthen',
    name: '泛醇（维生素B5）',
    brandNames: ['贝亲护臀膏', 'Bepanthen'],
    category: '皮肤护理',
    form: '软膏',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '尿布疹、皮肤干燥的护理。促进皮肤修复，出生即可使用。',
  },
  {
    id: 'baby_hydrocortisone',
    name: '氢化可的松乳膏（弱效）',
    brandNames: ['尤卓尔'],
    category: '皮肤护理',
    form: '乳膏',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'caution', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '湿疹/皮炎短期使用。仅用1%浓度，连续不超过7天。面部和褶皱部位慎用。大面积使用需医生指导。',
  },
  {
    id: 'baby_tacrolimus',
    name: '他克莫司软膏',
    brandNames: ['普特彼', 'Protopic'],
    category: '皮肤护理',
    form: '软膏',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'forbidden', baby_3_6y: 'caution' },
    note: '中重度特应性皮炎的二线用药。2岁以下禁用。仅用于2岁以上对其他治疗无效的患儿。',
  },
  {
    id: 'baby_mupirocin',
    name: '莫匹罗星软膏',
    brandNames: ['百多邦', 'Bactroban'],
    category: '皮肤护理',
    form: '软膏',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '外用抗生素。用于细菌性皮肤感染（脓疱疮、毛囊炎）。外用3-5天，新生儿也可使用。',
  },
  {
    id: 'baby_clotrimazole_skin',
    name: '克霉唑乳膏',
    brandNames: ['凯妮汀'],
    category: '皮肤护理',
    form: '乳膏',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '抗真菌药。用于念珠菌性尿布疹、体股癣。3个月以下婴儿需医生指导。',
  },

  // ─── 过敏 ───
  {
    id: 'baby_cetirizine',
    name: '西替利嗪滴剂',
    brandNames: ['仙特明', 'Zyrtec'],
    category: '过敏',
    form: '滴剂/口服液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '第二代抗组胺药。6个月以上可用。用于荨麻疹、过敏性鼻炎。嗜睡副作用较小。',
    dosageNote: '6-12月：2.5mg/日；1-2岁：2.5mg/次，每日2次；2-6岁：2.5-5mg/次',
  },
  {
    id: 'baby_loratadine',
    name: '氯雷他定',
    brandNames: ['开瑞坦', 'Claritin'],
    category: '过敏',
    form: '口服液/糖浆',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '12个月以上可用。1天1次，方便。嗜睡副作用较轻。',
    dosageNote: '1-2岁：2.5mg/日；2-6岁：5mg/日',
  },
  {
    id: 'baby_diphenhydramine',
    name: '苯海拉明',
    brandNames: ['Benadryl'],
    category: '过敏',
    form: '口服液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'caution', baby_3_6y: 'safe' },
    note: '第一代抗组胺药。2岁以下需咨询医生。嗜睡作用明显，可辅助缓解瘙痒和帮助睡眠。',
  },

  // ─── 抗生素（儿科用） ───
  {
    id: 'baby_amoxicillin',
    name: '阿莫西林（儿童）',
    brandNames: ['再林', '阿莫仙'],
    category: '抗生素',
    form: '颗粒/混悬液',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '儿科常用抗生素，需确认无青霉素过敏。用于中耳炎、链球菌咽炎。按体重计算剂量，足疗程服用。',
    dosageNote: '按体重20-40mg/kg/日，分3次',
  },
  {
    id: 'baby_amoxicillin_clavulanate',
    name: '阿莫西林克拉维酸钾',
    brandNames: ['安奇', 'Augmentin'],
    category: '抗生素',
    form: '干混悬剂',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '用于耐药菌感染。腹泻副作用较阿莫西林常见。随餐服用减轻胃肠不适。',
  },
  {
    id: 'baby_cefixime',
    name: '头孢克肟（儿童）',
    brandNames: ['世福素', 'Suprax'],
    category: '抗生素',
    form: '颗粒/混悬液',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '第三代头孢。用于支气管炎、中耳炎、尿路感染。6个月以下需医生评估。',
  },
  {
    id: 'baby_azithromycin',
    name: '阿奇霉素（儿童）',
    brandNames: ['希舒美', 'Zithromax'],
    category: '抗生素',
    form: '颗粒/混悬液',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '疗程短(3-5天)，1天1次。用于支原体感染。6个月以下需医生评估。可能引起胃肠不适。',
  },
  {
    id: 'baby_gentamicin',
    name: '庆大霉素（口服）',
    brandNames: [],
    category: '抗生素',
    form: '颗粒',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'caution', baby_3_6y: 'caution' },
    note: '氨基糖苷类。有耳肾毒性，儿童慎用。仅在医生明确诊断下短程使用。',
  },

  // ─── 疫苗 ───
  // 非药物类，列入供参考

  // ─── 维生素/营养 ───
  {
    id: 'baby_vitamin_d',
    name: '维生素D',
    brandNames: ['伊可新', '悦而', 'Ddrops'],
    category: '维生素',
    form: '滴剂/胶囊',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '出生后几天开始补充！400IU/日，预防佝偻病。维生素D3（胆钙化醇）优于D2。持续补充至2-3岁。',
    dosageNote: '0-1岁：400IU/日；1-3岁：400-600IU/日',
  },
  {
    id: 'baby_iron',
    name: '铁剂（婴幼儿）',
    brandNames: ['蛋白琥珀酸铁', '力蜚能'],
    category: '维生素',
    form: '口服液/滴剂',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '足月儿6个月起开始补充；早产儿2周起补充。与维生素C同服促进吸收。牙齿染色属正常，用后刷牙。',
    dosageNote: '早产儿：2-4mg/kg/日；6-12月：1mg/kg/日（元素铁）',
  },
  {
    id: 'baby_vitamin_a',
    name: '维生素A',
    brandNames: ['伊可新(含)'],
    category: '维生素',
    form: '滴剂/胶囊',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '维生素A缺乏地区需补充。常规预防剂量1500IU/日安全。过量(>5000IU/日)可致中毒，勿超量。',
  },
  {
    id: 'baby_calcium',
    name: '钙剂（婴幼儿）',
    brandNames: ['葡萄糖酸钙', '乳酸钙'],
    category: '维生素',
    form: '口服液/颗粒',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '正常奶量喂养的宝宝一般不需要补钙。确诊缺钙或维生素D充足仍有佝偻病表现时才需补充。不要盲目补钙。',
  },

  // ─── 鼻/眼 ───
  {
    id: 'baby_erythromycin_eye',
    name: '红霉素眼膏',
    brandNames: ['红霉素眼膏'],
    category: '五官用药',
    form: '眼膏',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '新生儿眼部感染、泪囊炎的常用药。也可用于鼻前庭炎。',
  },
  {
    id: 'baby_tobramycin_eye',
    name: '妥布霉素滴眼液',
    brandNames: ['托百士', 'Tobrex'],
    category: '五官用药',
    form: '滴眼液',
    ageRanges: { baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '氨基糖苷类抗生素眼药。1岁以下需医生指导。',
  },
  {
    id: 'baby_ofloxacin_eye',
    name: '氧氟沙星滴眼液',
    brandNames: ['泰利必妥'],
    category: '五官用药',
    form: '滴眼液',
    ageRanges: { baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'caution', baby_3_6y: 'safe' },
    note: '喹诺酮类。动物实验对幼年动物软骨有影响，1岁以下避免使用，1-3岁慎用。',
  },

  // ─── 急救/对症 ───
  {
    id: 'baby_epipen',
    name: '肾上腺素自动注射笔',
    brandNames: ['EpiPen', 'Auvi-Q'],
    category: '急救',
    form: '注射笔',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '严重过敏反应的救命药！有严重食物/药物过敏史的宝宝应常备。使用后立即就医。有婴幼儿专用剂量(0.15mg)。',
  },
  {
    id: 'baby_naloxone',
    name: '纳洛酮',
    brandNames: ['Narcan'],
    category: '急救',
    form: '鼻喷/注射',
    ageRanges: { baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe', baby_3_6y: 'safe' },
    note: '阿片类药物过量急救。用于新生儿窒息、呼吸抑制。',
  },
];
