/**
 * 图片转粒子 —— 《指尖造境》
 *
 * 第一阶段能力（本地实现，不依赖任何 AI 服务）：
 *   1. 密度采样：按图像亮度/Alpha 分布粒子，亮处密集
 *   2. 轮廓采样：Sobel 边缘检测提取轮廓，按边缘强度分布粒子
 *   3. 颜色继承：粒子颜色取自图像采样像素（带发光增强）
 *   4. 深度映射：亮度 → Z 轴深度，形成浅浮雕立体感
 *
 * 预留接口：
 *   - sampleFromSource(source) 支持 HTMLImageElement / Canvas / Video 帧
 *   - 后续 AI 生成图像可直接调用同一入口进入粒子系统
 */

import { CONFIG } from './config.js?v=awakening1';

export class ImageToParticles {
  /**
   * @param {import('./particles.js?v=awakening1').ParticleSystem} particles
   */
  constructor(particles) {
    this.ps = particles;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.lastInfo = null;
  }

  /**
   * 从任意图像源生成粒子目标与颜色
   * @param {HTMLImageElement|HTMLCanvasElement} source
   * @param {Object} [options]
   * @param {'density'|'contour'} [options.mode='density'] 采样模式
   * @param {number} [options.gridW=180] 采样网格宽
   * @param {number} [options.depthScale=1] 深度强度
   * @param {boolean} [options.inheritColor=true] 是否继承图像颜色
   * @param {number} [options.brightness=1.35] 发光增强
   * @returns {{points:number, gridW:number, gridH:number, mode:string}}
   */
  generate(source, options = {}) {
    const {
      mode = 'density',
      gridW = 180,
      depthScale = 1,
      inheritColor = true,
      brightness = 1.35,
    } = options;

    const N = this.ps.pos.length / 3;
    const world = CONFIG.world.image;

    // ── 1. 绘制到离屏画布并降采样 ──
    const sw = source.width || source.videoWidth || 512;
    const sh = source.height || source.videoHeight || 512;
    const gridH = Math.max(2, Math.round((gridW * sh) / sw));
    this.canvas.width = gridW;
    this.canvas.height = gridH;
    this.ctx.drawImage(source, 0, 0, gridW, gridH);
    this._lastSource = source; // 缓存，便于切换采样模式时重新生成

    const img = this.ctx.getImageData(0, 0, gridW, gridH);
    const data = img.data;

    // 装裱尺寸：保持图像宽高比，适配到取景框内（居中悬浮的“画”）
    const srcAspect = sw / sh;
    const frameAspect = world.maxW / world.maxH;
    let frameW, frameH;
    if (srcAspect >= frameAspect) {
      frameW = world.maxW;
      frameH = world.maxW / srcAspect;
    } else {
      frameH = world.maxH;
      frameW = world.maxH * srcAspect;
    }

    // ── 2. 计算每格亮度 / 边缘强度 / 权重 ──
    const lum = new Float32Array(gridW * gridH);
    const weight = new Float32Array(gridW * gridH);
    const edges = mode === 'contour' ? this._sobel(data, gridW, gridH) : null;

    let totalWeight = 0;
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const idx = gy * gridW + gx;
        const i4 = idx * 4;
        const l = (0.299 * data[i4] + 0.587 * data[i4 + 1] + 0.114 * data[i4 + 2]) / 255;
        lum[idx] = l;
        let w;
        if (mode === 'contour') {
          w = edges[idx];                     // 轮廓模式：边缘强度即权重
        } else {
          w = 0.06 + l * 0.94;                // 密度模式：亮度即权重（保留微弱底色）
        }
        const alpha = data[i4 + 3] / 255;
        w *= 0.25 + alpha * 0.75;             // 透明区域稀疏
        weight[idx] = w;
        totalWeight += w;
      }
    }

    // ── 3. 按权重为每颗粒子挑选采样点（轮盘赌 + 累积分布） ──
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const cumulative = new Float32Array(gridW * gridH);
    let acc = 0;
    for (let i = 0; i < weight.length; i++) {
      acc += weight[i];
      cumulative[i] = acc;
    }
    const invTotal = acc > 0 ? 1 / acc : 0;

    for (let p = 0; p < N; p++) {
      // 确定性伪随机（可复现）
      const r = pseudoRandom(p * 2654435761 + 12345);
      const target = r * acc;
      let cell = this._binarySearch(cumulative, target);

      const gx = cell % gridW;
      const gy = Math.floor(cell / gridW);

      // 世界坐标：居中 + 保持图像宽高比（装裱悬浮）
      const nx = (gx + pseudoRandom(p * 40503 + 7) - 0.5) / gridW - 0.5;
      const ny = 0.5 - (gy + pseudoRandom(p * 9169 + 13) - 0.5) / gridH;
      const nz = (lum[cell] - 0.5) * CONFIG.world.image.z * depthScale;

      // 边缘溶解：靠近装裱边界的粒子增加抖动，形成有机的“光尘消散”感
      const edge = Math.max(Math.abs(nx), Math.abs(ny)) * 2;
      const dissolve = edge * edge * 2.6;
      const jx = (pseudoRandom(p * 60001 + 3) - 0.5) * dissolve;
      const jy = (pseudoRandom(p * 70007 + 11) - 0.5) * dissolve;

      const i3 = p * 3;
      positions[i3] = nx * frameW + jx;
      positions[i3 + 1] = ny * frameH + jy;
      positions[i3 + 2] = nz;

      // 颜色：图像采样 + 发光增强
      const i4 = cell * 4;
      if (inheritColor) {
        colors[i3] = Math.min(1, (data[i4] / 255) * brightness);
        colors[i3 + 1] = Math.min(1, (data[i4 + 1] / 255) * brightness);
        colors[i3 + 2] = Math.min(1, (data[i4 + 2] / 255) * brightness);
      } else {
        colors[i3] = 0.5;
        colors[i3 + 1] = 0.7;
        colors[i3 + 2] = 1.0;
      }
    }

    this.ps.setImageTargets(positions, colors);
    this.lastInfo = {
      points: N,
      gridW,
      gridH,
      mode,
      coverage: Math.round(invTotal * 1000) / 10,
    };
    return this.lastInfo;
  }

  /** Sobel 边缘检测，返回每格边缘强度 0–1 */
  _sobel(data, w, h) {
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const i4 = i * 4;
      gray[i] = (0.299 * data[i4] + 0.587 * data[i4 + 1] + 0.114 * data[i4 + 2]) / 255;
    }
    const out = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx =
          -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
          gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
        const gy =
          -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
          gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
        out[i] = Math.min(1, Math.sqrt(gx * gx + gy * gy));
      }
    }
    // 边缘强度幂次增强，让轮廓更聚拢
    for (let i = 0; i < out.length; i++) out[i] = Math.pow(out[i], 1.4);
    return out;
  }

  _binarySearch(cumulative, target) {
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** 从本地文件加载 */
  loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve(this.generate(img));
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图像加载失败'));
      };
      img.src = url;
    });
  }

  /** 从 URL 加载（本地测试图片 / 未来的 AI 生成图） */
  loadFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(this.generate(img));
      img.onerror = () => reject(new Error('图像加载失败: ' + url));
      img.src = url;
    });
  }
}

/** 确定性伪随机 0–1（mulberry32 风格） */
function pseudoRandom(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
