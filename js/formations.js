/**
 * 形态算法 —— 《指尖造境》
 *
 * 全部继承自原开源项目 ppongtong/gesture-particle (MIT) 的形态生成算法：
 *   idle    —— 缓慢自转的呼吸球体（Fibonacci 球面 + 时间旋转）
 *   sphere  —— 球体（预计算 Fibonacci 偏移 + 手部跟随）
 *   scatter —— 星散（进入时预烘焙随机位置）
 *   vortex  —— 漩涡（螺旋柱 + 时间旋转）
 *   wave    —— 波浪（XZ 网格 + sin×cos 位移）
 *   implode —— 坍塌（汇聚到指尖 + 微抖动）
 *   follow  —— 随形（松散旋转云团跟随手部）
 *
 * 新增：
 *   image   —— 图像形态（由 imageToParticles 模块写入目标与颜色，
 *              此处叠加轻微的呼吸浮动，使画面保持“生命感”）
 */

import { CONFIG } from './config.js?v=awakening1';

const GOLDEN = (1 + Math.sqrt(5)) / 2;

/**
 * 计算当前帧所有粒子的目标位置，写入 ps.tgt
 * @param {ParticleSystem} ps
 * @param {number} t  时间（秒）
 * @param {number} handX 手部世界坐标 X
 * @param {number} handY 手部世界坐标 Y
 */
export function computeFormationTargets(ps, t, handX, handY) {
  const { tgt, sphereOff, scatterTgt, hues } = ps;
  const N = ps.activeCount ?? tgt.length / 3;
  const cx = handX, cy = handY, cz = 0;

  switch (ps.mode) {

    case 'idle': {
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const lat = Math.acos(1 - 2 * (i + 0.5) / N);
        const lon = 2 * Math.PI * i / GOLDEN + t * 0.08;
        const r = CONFIG.world.sphereR * (1.1 + 0.3 * Math.sin(t * 0.4 + hues[i] * 6));
        tgt[i3] = r * Math.sin(lat) * Math.cos(lon);
        tgt[i3 + 1] = r * Math.cos(lat);
        tgt[i3 + 2] = r * Math.sin(lat) * Math.sin(lon);
      }
      break;
    }

    case 'sphere': {
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        tgt[i3] = cx + sphereOff[i3];
        tgt[i3 + 1] = cy + sphereOff[i3 + 1];
        tgt[i3 + 2] = cz + sphereOff[i3 + 2];
      }
      break;
    }

    case 'scatter': {
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        tgt[i3] = scatterTgt[i3];
        tgt[i3 + 1] = scatterTgt[i3 + 1];
        tgt[i3 + 2] = scatterTgt[i3 + 2];
      }
      break;
    }

    case 'vortex': {
      const H = CONFIG.world.vortexH;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const frac = i / N;
        const angle = frac * Math.PI * 28 + t * 2.5;
        const r = 4 + frac * 22;
        const h = (frac - 0.5) * H;
        tgt[i3] = cx + r * Math.cos(angle);
        tgt[i3 + 1] = cy + h;
        tgt[i3 + 2] = cz + r * Math.sin(angle);
      }
      break;
    }

    case 'wave': {
      const cols = Math.ceil(Math.sqrt(N));
      const size = CONFIG.world.waveSize;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const ix = i % cols;
        const iy = Math.floor(i / cols);
        const x = (ix / cols - 0.5) * size;
        const z = (iy / cols - 0.5) * size;
        const y = Math.sin(x * 0.22 + t * 2.2) * Math.cos(z * 0.22 + t * 1.6) * 12;
        tgt[i3] = cx + x;
        tgt[i3 + 1] = cy + y;
        tgt[i3 + 2] = cz + z;
      }
      break;
    }

    case 'implode': {
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        tgt[i3] = cx + (Math.random() - 0.5) * 0.8;
        tgt[i3 + 1] = cy + (Math.random() - 0.5) * 0.8;
        tgt[i3 + 2] = cz + (Math.random() - 0.5) * 0.8;
      }
      break;
    }

    case 'follow': {
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const frac = i / N;
        const angle = frac * Math.PI * 40 + t * 1.5;
        const r = 2 + frac * 18;
        const lat = Math.acos(1 - 2 * (i + 0.5) / N);
        tgt[i3] = cx + r * Math.sin(lat) * Math.cos(angle);
        tgt[i3 + 1] = cy + r * Math.cos(lat);
        tgt[i3 + 2] = cz + r * Math.sin(lat) * Math.sin(angle);
      }
      break;
    }

    case 'image': {
      // 图像形态：目标由 ImageToParticles 写入 ps.imageTargets
      const src = ps.imageTargets;
      if (!src) break;
      const wob = 1.4;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        tgt[i3] = src[i3];
        tgt[i3 + 1] = src[i3 + 1] + Math.sin(t * 1.2 + i * 0.013) * wob * 0.35;
        tgt[i3 + 2] = src[i3 + 2] + Math.cos(t * 0.9 + i * 0.017) * wob * 0.35;
      }
      break;
    }
  }
}
