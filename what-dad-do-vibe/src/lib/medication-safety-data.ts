// 孕期用药安全参考数据
// 数据来源: FDA Pregnancy Categories + 中国药典临床用药须知
// 仅供参考，具体用药请遵医嘱

export interface MedicationSafety {
  id: string;
  name: string;           // 通用名/主要成分
  brandNames?: string[];  // 常见商品名
  category: string;       // 分类
  fdaCategory?: string;   // FDA分级 A/B/C/D/X/N
  safety: {
    preconception: 'safe' | 'caution' | 'forbidden';
    first: 'safe' | 'caution' | 'forbidden';
    second: 'safe' | 'caution' | 'forbidden';
    third: 'safe' | 'caution' | 'forbidden';
    postpartum: 'safe' | 'caution' | 'forbidden';
    baby_0_3m: 'safe' | 'caution' | 'forbidden';
    baby_3_12m: 'safe' | 'caution' | 'forbidden';
    baby_1_3y: 'safe' | 'caution' | 'forbidden';
  };
  note: string;
}

export const MEDICATION_DATA: MedicationSafety[] = [
  // ─── 感冒用药 ───
  {
    id: 'acetaminophen',
    name: '对乙酰氨基酚',
    brandNames: ['泰诺', '扑热息痛', '必理通'],
    category: '感冒用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期解热镇痛的优先选择。避免超过每日最大剂量(3g/日)。',
  },
  {
    id: 'ibuprofen',
    name: '布洛芬',
    brandNames: ['芬必得', '美林', 'Advil', 'Motrin'],
    category: '感冒用药',
    fdaCategory: 'B/D(孕晚期)',
    safety: { preconception: 'caution', first: 'caution', second: 'caution', third: 'forbidden', postpartum: 'caution', baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe' },
    note: '孕早期可能增加流产风险；孕晚期禁用(可致动脉导管早闭)。哺乳期慎用。',
  },
  {
    id: 'aspirin',
    name: '阿司匹林',
    brandNames: ['拜阿司匹林', '巴米尔'],
    category: '感冒用药',
    fdaCategory: 'C/D(孕晚期)',
    safety: { preconception: 'caution', first: 'forbidden', second: 'caution', third: 'forbidden', postpartum: 'caution', baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe' },
    note: '孕期常规止痛禁用。低剂量(≤100mg/日)可用于特定妊娠并发症(需医嘱)。',
  },
  {
    id: 'pseudoephedrine',
    name: '伪麻黄碱',
    brandNames: ['新康泰克(含)', '白加黑(含)'],
    category: '感冒用药',
    fdaCategory: 'C',
    safety: { preconception: 'caution', first: 'forbidden', second: 'caution', third: 'caution', postpartum: 'caution', baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕早期禁用(可能增加腹裂风险)。孕中晚期慎用，高血压患者禁用。',
  },
  {
    id: 'dextromethorphan',
    name: '右美沙芬',
    brandNames: ['惠菲宁(含)', '泰诺感冒片(含)'],
    category: '感冒用药',
    fdaCategory: 'C',
    safety: { preconception: 'caution', first: 'caution', second: 'caution', third: 'caution', postpartum: 'caution', baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕早期尽量避免。孕中晚期在医生指导下使用。',
  },
  {
    id: 'chlorpheniramine',
    name: '氯苯那敏(扑尔敏)',
    brandNames: ['泰诺感冒片(含)', '新康泰克(含)'],
    category: '感冒用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期较安全的抗组胺药，但孕晚期长期使用可能影响新生儿。',
  },

  // ─── 止痛/退热 ───
  {
    id: 'naproxen',
    name: '萘普生',
    brandNames: ['萘普生片', 'Aleve'],
    category: '止痛药',
    fdaCategory: 'B/D(孕晚期)',
    safety: { preconception: 'caution', first: 'caution', second: 'caution', third: 'forbidden', postpartum: 'caution', baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe' },
    note: '孕晚期禁用。原理同布洛芬，属NSAIDs类药物。',
  },
  {
    id: 'lidocaine',
    name: '利多卡因',
    brandNames: ['局部麻醉用'],
    category: '止痛药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '局部使用(如牙科麻醉、局部注射)安全。静脉大剂量使用需评估。',
  },

  // ─── 抗过敏 ───
  {
    id: 'cetirizine',
    name: '西替利嗪',
    brandNames: ['仙特明', 'Zyrtec'],
    category: '抗过敏',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期较安全的抗过敏药之一。按常规剂量使用。',
  },
  {
    id: 'loratadine',
    name: '氯雷他定',
    brandNames: ['开瑞坦', 'Claritin'],
    category: '抗过敏',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期首选抗过敏药之一。',
  },
  {
    id: 'diphenhydramine',
    name: '苯海拉明',
    brandNames: ['Benadryl'],
    category: '抗过敏',
    fdaCategory: 'B',
    safety: { preconception: 'caution', first: 'safe', second: 'safe', third: 'caution', postpartum: 'caution', baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕晚期使用可能引起宫缩，临产前慎用。哺乳期影响乳汁分泌。',
  },

  // ─── 抗生素 ───
  {
    id: 'amoxicillin',
    name: '阿莫西林',
    brandNames: ['阿莫仙', '弗莱莫星'],
    category: '抗生素',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期常用的安全抗生素，需排除青霉素过敏。',
  },
  {
    id: 'cephalexin',
    name: '头孢氨苄',
    brandNames: ['先锋霉素Ⅳ', '头孢拉定'],
    category: '抗生素',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '头孢菌素类，孕期安全。注意头孢类过敏史。',
  },
  {
    id: 'azithromycin',
    name: '阿奇霉素',
    brandNames: ['希舒美', '泰力特'],
    category: '抗生素',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'caution', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '大环内酯类，孕早期慎用，孕中晚期较安全。',
  },
  {
    id: 'doxycycline',
    name: '多西环素(强力霉素)',
    brandNames: ['强力霉素', 'Doryx'],
    category: '抗生素',
    fdaCategory: 'D',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'forbidden', baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'safe' },
    note: '四环素类，孕期及哺乳期禁用！可致胎儿牙齿染色和骨骼发育不良。',
  },
  {
    id: 'nitrofurantoin',
    name: '呋喃妥因',
    brandNames: ['呋喃坦啶', 'Macrobid'],
    category: '抗生素',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'caution', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期尿路感染的常用药。孕晚期(G6PD缺乏者)慎用。',
  },
  {
    id: 'metronidazole',
    name: '甲硝唑',
    brandNames: ['灭滴灵', 'Flagyl'],
    category: '抗生素',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'caution', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕早期尽量避免使用(理论致畸风险)，孕中晚期安全。',
  },

  // ─── 消化系统 ───
  {
    id: 'omeprazole',
    name: '奥美拉唑',
    brandNames: ['洛赛克', '奥克', 'Prilosec'],
    category: '消化用药',
    fdaCategory: 'C',
    safety: { preconception: 'safe', first: 'caution', second: 'caution', third: 'caution', postpartum: 'caution', baby_0_3m: 'caution', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期胃食管反流可用，但建议短期使用。孕早期谨慎。',
  },
  {
    id: 'ranitidine',
    name: '雷尼替丁',
    brandNames: ['善胃得', 'Zantac'],
    category: '消化用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期较安全的抑酸药。(注：部分产品因NDMA杂质问题已退市)',
  },
  {
    id: 'lactulose',
    name: '乳果糖',
    brandNames: ['杜密克', '利动'],
    category: '消化用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期便秘的首选用药，几乎不被吸收，安全性高。',
  },
  {
    id: 'docusate',
    name: '多库酯钠',
    brandNames: ['Colace'],
    category: '消化用药',
    fdaCategory: 'C',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '大便软化剂，孕期便秘可安全使用。',
  },
  {
    id: 'bismuth_subsalicylate',
    name: '次水杨酸铋',
    brandNames: ['Pepto-Bismol'],
    category: '消化用药',
    fdaCategory: 'C/D',
    safety: { preconception: 'caution', first: 'forbidden', second: 'caution', third: 'caution', postpartum: 'caution', baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe' },
    note: '含铋和水杨酸盐，孕期避免使用。哺乳期避免。',
  },
  {
    id: 'aluminum_magnesium',
    name: '铝碳酸镁',
    brandNames: ['达喜', 'Tums'],
    category: '消化用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期胃灼热的常用抗酸药，按需短期使用。',
  },

  // ─── 皮肤外用药 ───
  {
    id: 'mupirocin',
    name: '莫匹罗星(百多邦)',
    brandNames: ['百多邦', 'Bactroban'],
    category: '皮肤外用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '局部外用抗生素，外用吸收极少，孕期安全。',
  },
  {
    id: 'clotrimazole',
    name: '克霉唑',
    brandNames: ['凯妮汀', 'Canesten'],
    category: '皮肤外用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '局部抗真菌药，阴道栓剂孕期可用。外用安全性高。',
  },
  {
    id: 'tretinoin_topical',
    name: '维A酸(外用)',
    brandNames: ['维A酸乳膏', 'Retin-A'],
    category: '皮肤外用药',
    fdaCategory: 'C',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'forbidden', baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'safe' },
    note: '孕期及哺乳期禁用！有明确的致畸性。备孕期也应停用。',
  },
  {
    id: 'hydrocortisone_topical',
    name: '氢化可的松(外用)',
    brandNames: ['尤卓尔', '皮质醇软膏'],
    category: '皮肤外用药',
    fdaCategory: 'C',
    safety: { preconception: 'safe', first: 'caution', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '弱效激素，小面积短期外用安全。大面积或长期使用需遵医嘱。',
  },

  // ─── 维生素/补充剂 ───
  {
    id: 'folic_acid',
    name: '叶酸(维生素B9)',
    brandNames: ['斯利安', '叶酸片'],
    category: '维生素/补充剂',
    fdaCategory: 'A',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '备孕及孕期必需！建议备孕期开始每日补充0.4-0.8mg。',
  },
  {
    id: 'vitamin_d',
    name: '维生素D',
    brandNames: ['维生素D3滴剂'],
    category: '维生素/补充剂',
    fdaCategory: 'A',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期推荐每日补充400-800IU。过量(>4000IU/日)可能有害。',
  },
  {
    id: 'iron_supplement',
    name: '铁剂(硫酸亚铁等)',
    brandNames: ['力蜚能', '速力菲', 'Ferrous sulfate'],
    category: '维生素/补充剂',
    fdaCategory: 'A',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期预防和治疗贫血的安全用药。建议饭后服用减少胃肠刺激。',
  },
  {
    id: 'calcium_supplement',
    name: '钙剂(碳酸钙等)',
    brandNames: ['钙尔奇', '迪巧'],
    category: '维生素/补充剂',
    fdaCategory: 'A',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期推荐补充1000-1200mg/日。柠檬酸钙吸收更好，适合胃酸少者。',
  },
  {
    id: 'vitamin_a_high_dose',
    name: '维生素A(大剂量)',
    brandNames: ['维A胶丸'],
    category: '维生素/补充剂',
    fdaCategory: 'A/X(大剂量)',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'forbidden', baby_0_3m: 'caution', baby_3_12m: 'caution', baby_1_3y: 'safe' },
    note: '大剂量维生素A(>5000IU/日)有致畸性！孕前3个月及孕期禁止大剂量补充。',
  },
  {
    id: 'fish_oil',
    name: '鱼油/DHA',
    brandNames: ['孕妇DHA软胶囊'],
    category: '维生素/补充剂',
    fdaCategory: '未分级',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期推荐补充DHA 200-300mg/日，有助于胎儿大脑和视力发育。',
  },

  // ─── 中药/中成药 ───
  {
    id: 'angelica',
    name: '当归',
    brandNames: ['当归片', '当归养血丸'],
    category: '中药/中成药',
    fdaCategory: 'N',
    safety: { preconception: 'caution', first: 'forbidden', second: 'caution', third: 'forbidden', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕早期和孕晚期禁用(有兴奋子宫作用)。产后可用于调理。',
  },
  {
    id: 'ginseng',
    name: '人参',
    brandNames: ['人参片', '红参'],
    category: '中药/中成药',
    fdaCategory: 'N',
    safety: { preconception: 'caution', first: 'caution', second: 'caution', third: 'caution', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '孕期慎用，可能影响血压和血糖。气虚明显者可在中医师指导下使用。',
  },
  {
    id: 'aloe_vera_oral',
    name: '芦荟(口服)',
    brandNames: ['芦荟胶囊', '芦荟汁'],
    category: '中药/中成药',
    fdaCategory: 'C',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'caution', baby_0_3m: 'forbidden', baby_3_12m: 'caution', baby_1_3y: 'safe' },
    note: '口服芦荟有刺激性泻下作用，孕期禁用(可致盆腔充血)。外用药用安全。',
  },

  // ─── 妇科用药 ───
  {
    id: 'progesterone',
    name: '黄体酮(孕酮)',
    brandNames: ['安琪坦', '黄体酮胶囊', '益玛欣'],
    category: '妇科用药',
    fdaCategory: 'D',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'caution', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '遵医嘱用于保胎。不能自行使用。孕晚期可能影响宫缩。',
  },
  {
    id: 'clomiphene',
    name: '克罗米芬(氯米芬)',
    brandNames: ['舒经酚', 'Clomid'],
    category: '妇科用药',
    fdaCategory: 'B',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'forbidden', baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'forbidden' },
    note: '❗ 确认怀孕后立即停用。该药仅用于促排卵治疗，禁用于孕期。',
  },

  // ─── 其他常用 ───
  {
    id: 'insulin',
    name: '胰岛素',
    brandNames: ['诺和灵', '优泌林'],
    category: '慢性病用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '妊娠期糖尿病的标准用药。不通过胎盘，安全性高。剂量需随孕期调整。',
  },
  {
    id: 'metformin',
    name: '二甲双胍',
    brandNames: ['格华止', 'Glucophage'],
    category: '慢性病用药',
    fdaCategory: 'B',
    safety: { preconception: 'safe', first: 'safe', second: 'safe', third: 'safe', postpartum: 'safe', baby_0_3m: 'safe', baby_3_12m: 'safe', baby_1_3y: 'safe' },
    note: '妊娠期糖尿病和PCOS的常用药。近年研究表明孕期使用相对安全。',
  },
  {
    id: 'warfarin',
    name: '华法林',
    brandNames: ['Coumadin'],
    category: '慢性病用药',
    fdaCategory: 'X',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'forbidden', baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'safe' },
    note: '❌ 孕期禁用！有明确致畸性。备孕期应更换为低分子肝素。',
  },
  {
    id: 'isotretinoin',
    name: '异维A酸(口服)',
    brandNames: ['泰尔丝', 'Accutane'],
    category: '皮肤外用药',
    fdaCategory: 'X',
    safety: { preconception: 'forbidden', first: 'forbidden', second: 'forbidden', third: 'forbidden', postpartum: 'forbidden', baby_0_3m: 'forbidden', baby_3_12m: 'forbidden', baby_1_3y: 'forbidden' },
    note: '❌ 最强致畸药物之一！停药后至少3个月(建议1年)方可备孕。',
  },
];
