/**
 * AI 创作接口 —— 《指尖造境》
 *
 * ⚠️ 第一阶段说明（重要，请勿删除）：
 *   本模块目前【未接入任何 AI 服务】。它是一个预留的清晰接口：
 *   当后续接入图像生成 API 时，只需在 window.__REALM_AI_CONFIG__ 中
 *   配置 endpoint / apiKey / model，本模块即可将文字描述转为图像，
 *   再交给 ImageToParticles 模块转化为粒子形态。
 *
 * 接入方式（第二阶段）：
 *   window.__REALM_AI_CONFIG__ = {
 *     endpoint: 'https://api.example.com/v1/images',
 *     apiKey:   'YOUR_KEY',
 *     model:    'model-name',
 *   };
 */

export class AINotConfiguredError extends Error {
  constructor() {
    super('AI 接口尚未配置');
    this.code = 'AI_NOT_CONFIGURED';
  }
}

export class AIGenerationClient {
  constructor(config = null) {
    this.config = config || window.__REALM_AI_CONFIG__ || null;
  }

  /** 是否已配置 AI 服务 */
  get isConfigured() {
    return !!(this.config && this.config.endpoint && this.config.apiKey);
  }

  /** 当前配置状态描述（供 UI 诚实展示） */
  describe() {
    return {
      configured: this.isConfigured,
      provider: this.config?.provider || '未配置',
      model: this.config?.model || '—',
      message: this.isConfigured
        ? 'AI 接口已就绪'
        : '第一阶段未接入 AI 服务 —— 接口已预留，待第二阶段接入',
    };
  }

  /**
   * 文生图（预留接口）
   * @param {string} prompt 文字描述
   * @param {{size?:string}} [_options]
   * @returns {Promise<{imageUrl:string, provider:string, model:string}>}
   * @throws {AINotConfiguredError} 未配置时抛出，UI 据此展示“待接入”状态
   */
  async generateImage(prompt, _options = {}) {
    if (!this.isConfigured) throw new AINotConfiguredError();

    // ── 第二阶段在此实现真实调用，示例结构： ──
    // const res = await fetch(this.config.endpoint, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ model: this.config.model, prompt, n: 1, size: _options.size || '1024x1024' }),
    // });
    // const json = await res.json();
    // return { imageUrl: json.data[0].url, provider: this.config.provider, model: this.config.model };

    throw new AINotConfiguredError();
  }
}

/** 风格预设（仅作为提示词参考，不涉及任何服务调用） */
export const AI_STYLE_PRESETS = [
  { id: 'nebula',   name: '星云',   prompt: 'deep space nebula, cyan and violet particles, cinematic' },
  { id: 'organism',name: '生命体', prompt: 'bioluminescent organism, flowing filaments, organic glow' },
  { id: 'crystal',  name: '晶体',   prompt: 'iridescent crystal structure, sharp facets, prismatic light' },
  { id: 'abyss',    name: '深渊',   prompt: 'abyssal glow, dark ocean depth, faint golden particles' },
];
