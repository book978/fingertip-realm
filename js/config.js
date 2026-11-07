/**
 * 《指尖造境》 Realm at Fingertips
 * 全局配置 —— 所有可调参数集中于此
 *
 * 说明：粒子物理常数、手势阈值、坐标映射均继承自原开源项目
 * (ppongtong/gesture-particle, MIT)，保证原版手势交互的手感不变。
 */

export const CONFIG = {
  // ─── 粒子系统 ────────────────────────────────────────────
  particles: {
    count: 12000,        // 粒子总数（原版 10,000，略增以承载更细腻的图像采样）
    springK: 0.052,      // 弹簧系数：粒子被拉向目标的强度（原版值）
    damping: 0.87,       // 阻尼：速度衰减系数（原版值）
    noise: 0.004,        // 微湍流：让静止粒子保持“活着”的随机抖动（原版值）
    colorLerp: 0.025,    // 调色板过渡速度（原版值）
    imageColorLerp: 0.05,// 图像模式颜色过渡速度
  },

  // ─── 相机 ────────────────────────────────────────────────
  camera: {
    fov: 60,
    z: 80,               // 相机距原点距离（原版值）
    near: 0.1,
    far: 1000,
    orbitAmpX: 3,        // 相机缓慢环绕幅度（原版值）
    orbitAmpY: 1.5,
    orbitSpeed: 0.0004,
  },

  // ─── 手势映射 ────────────────────────────────────────────
  hand: {
    scaleX: 82,          // 归一化坐标 → 世界坐标 X 缩放（原版值）
    scaleY: 55,          // 归一化坐标 → 世界坐标 Y 缩放（原版值）
    lerp: 0.18,          // 手部位置平滑系数（原版值）
    swipeThreshold: 6,   // 滑动判定阈值（世界单位/5帧，原版值）
    swipeImpulseX: 0.18, // 滑动冲量系数（原版值）
    swipeImpulseY: 0.12,
    historyLen: 5,       // 滑动检测历史帧数（原版值）
    stabFrames: 4,       // 手势稳定帧数（原版值）
    pinchDist: 0.06,     // 捏合判定距离（原版值）
    extendThreshold: 0.03, // 手指伸展判定阈值（原版值）
  },

  // ─── 形态世界尺寸 ────────────────────────────────────────
  world: {
    sphereR: 20,         // 球体半径（原版值）
    scatterR: 65,        // 星散半径（原版值）
    vortexH: 65,         // 漩涡高度（原版值）
    waveSize: 50,        // 波浪网格尺寸（原版值）
    // 图像模式世界空间尺寸（装裱框：保持图像宽高比后适配）
    image: { maxW: 112, maxH: 70, z: 14 },
  },

  // ─── 调色板（HSL，0–1）────────────────────────────────────
  // 在原版配色基础上做电影级微调：更深、更透、更克制
  palettes: {
    idle:    { h: 0.58, s: 0.62, l: 0.55 },  // 冰蓝（待机呼吸）
    sphere:  { h: 0.52, s: 0.95, l: 0.62 },  // 青
    scatter: { h: 0.10, s: 0.95, l: 0.62 },  // 暖金
    vortex:  { h: 0.75, s: 0.90, l: 0.62 },  // 紫罗兰
    wave:    { h: 0.46, s: 0.85, l: 0.58 },  // 青绿
    implode: { h: 0.94, s: 0.95, l: 0.66 },  // 品红
    follow:  { h: 0.56, s: 0.85, l: 0.62 },  // 蓝青
  },

  // ─── 音频 ────────────────────────────────────────────────
  audio: {
    masterVolume: 0.5,
    ambientVolume: 0.35,
    padFrequencies: [400, 400, 400, 400], // 由和弦进行动态驱动（保留原版逻辑）
    filterBase: 1000,
    filterSwipeBoost: 150,
    filterSwipeMax: 2000,
    micSmoothing: 0.75,   // 麦克风能量平滑系数
    fftSize: 512,
  },

  // ─── 导出 ────────────────────────────────────────────────
  export: {
    imagePrefix: 'realm-at-fingertips',
    videoPrefix: 'realm-at-fingertips-reel',
    videoFps: 60,
    videoBitsPerSecond: 12_000_000,
  },
};

/** 形态清单（UI 与内部状态共用） */
export const FORMATIONS = [
  { id: 'idle',    name: '休眠',   en: 'DORMANT',  gesture: null,     hint: '无手势 · 呼吸球体' },
  { id: 'sphere',  name: '球体',   en: 'SPHERE',   gesture: 'fist',   hint: '握拳 · 凝聚成珠' },
  { id: 'scatter', name: '星散',   en: 'SCATTER',  gesture: 'open',   hint: '张开手掌 · 爆散星河' },
  { id: 'vortex',  name: '漩涡',   en: 'VORTEX',   gesture: 'point',  hint: '食指指向 · 龙卷漩涡' },
  { id: 'wave',    name: '波浪',   en: 'WAVE',     gesture: 'peace',  hint: '剪刀手 · 涟漪曲面' },
  { id: 'implode', name: '坍塌',   en: 'IMPLODE',  gesture: 'pinch',  hint: '捏合 · 万物归指' },
  { id: 'follow',  name: '随形',   en: 'FLOW',     gesture: 'default',hint: '任意手势 · 流云随行' },
  { id: 'image',   name: '图像',   en: 'IMAGE',    gesture: null,     hint: '图片转化 · 以图造境' },
];

/** 手势 → 形态映射（保留原版全部映射关系） */
export const GESTURE_TO_MODE = {
  fist: 'sphere',
  open: 'scatter',
  point: 'vortex',
  peace: 'wave',
  pinch: 'implode',
  default: 'follow',
};

/** 形态显示标签（保留原版标签语义） */
export const MODE_LABEL = {
  idle: 'DORMANT', sphere: 'SPHERE', scatter: 'SCATTER', vortex: 'VORTEX',
  wave: 'WAVE', implode: 'IMPLODE', follow: 'FLOW', image: 'IMAGE',
};
