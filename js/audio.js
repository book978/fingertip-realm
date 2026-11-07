/**
 * 声音引擎 —— 《指尖造境》
 *
 * 继承原开源项目 ppongtong/gesture-particle (MIT) 的生成式氛围音乐：
 *   - 4 振荡器和弦垫 + 缓慢颤音
 *   - 低通滤波器随手势/滑动能量动态调制
 *   - 手部位置选择和弦进行（I – V – vi – IV）
 *
 * 新增（实时声音互动）：
 *   - 麦克风输入：AnalyserNode 实时分析环境音/人声
 *   - 频率分层：低频/中频/高频能量分别驱动粒子湍流、尺寸与色温
 *   - RMS 能量平滑输出，供粒子系统每帧消费
 */

import { CONFIG } from './config.js?v=awakening1';
import {SOUND_CUES} from './soundCues.js?v=0.4.0';

export class AudioEngine {
  constructor({createContext=()=>new (window.AudioContext||window.webkitAudioContext)()}={}) {
    this.createContext=createContext;
    this.ctx = null;
    this.started = false;
    this.micEnabled = false;

    this.masterGain = null;
    this.ambientGain = null;
    this.filter = null;
    this.oscs = [];
    this.padGain = null;

    this.analyser = null;
    this.micStream = null;
    this.freqData = null;
    this.ambientAlways = false; // 展厅模式：无手势时也保持氛围

    this.level = 0;        // 平滑后的总能量 0–1
    this.bands = [0, 0, 0]; // 低/中/高频能量
    this._onLevel = null;
    this.cueNodes = new Set();
  }

  /** 启动音频上下文（必须由用户手势触发） */
  start({ambient=true}={}) {
    if (this.started) return;
    this.ctx = this.createContext();
    this.started = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // 主输出
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = CONFIG.audio.masterVolume;
    this.masterGain.connect(this.ctx.destination);
    if(!ambient)return;

    // 低通滤波（由手势与声音能量驱动）
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = CONFIG.audio.filterBase;
    this.filter.Q.value = 0.5;
    this.filter.connect(this.masterGain);

    // 氛围音量
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = CONFIG.audio.ambientVolume;
    this.ambientGain.connect(this.filter);

    // 和弦垫
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0; // 检测到手时淡入
    this.padGain.connect(this.ambientGain);

    // 缓慢颤音（原版机制：0.3Hz 呼吸感）
    const vibratoLfo = this.ctx.createOscillator();
    vibratoLfo.type = 'sine';
    vibratoLfo.frequency.value = 0.3;
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.value = 3;
    vibratoLfo.connect(vibratoGain);

    this.oscs = [];
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = 220;
      vibratoGain.connect(osc.frequency);
      osc.connect(this.padGain);
      osc.start();
      this.oscs.push(osc);
    }
    vibratoLfo.start();
    this.vibratoLfo=vibratoLfo;this.vibratoGain=vibratoGain;
  }

  setAmbientVolume(v) {
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2);
    }
  }

  /** 展厅模式：无手势时也保持氛围垫声 */
  setAmbientAlways(on) {
    this.ambientAlways = on;
  }

  /** 手势/滑动驱动滤波与和弦（保留原版映射逻辑） */
  update({ mode, handX, handY, handVisible, swipeEnergy }) {
    if (!this.started || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    let target = CONFIG.audio.filterBase;
    if (mode === 'scatter') target = 2000;
    else if (mode === 'implode') target = 300;
    // 麦克风能量额外抬升滤波频率
    target += Math.min(swipeEnergy * CONFIG.audio.filterSwipeBoost, CONFIG.audio.filterSwipeMax);
    target += this.level * 2400;
    this.filter.frequency.setTargetAtTime(target, now, 0.4);

    const padActive = handVisible || this.ambientAlways;
    if (padActive) {
      this.padGain.gain.setTargetAtTime(0.35, now, 1.0);

      // 展厅模式（无手势）使用静止的 I 级和弦；有手势时按原版逻辑随地平线移动变奏
      const basePitch = handVisible ? Math.max(80, 160 + handY * 6) : 160;
      let multipliers;
      if (handVisible && handX < -15) multipliers = [1.0, 1.25, 1.5, 2.0];        // I
      else if (handVisible && handX < 0) multipliers = [1.5, 1.875, 2.25, 3.0];   // V
      else if (handVisible && handX < 15) multipliers = [1.666, 2.0, 2.5, 3.333]; // vi
      else multipliers = [1.333, 1.666, 2.0, 2.666];                              // IV

      for (let i = 0; i < 4; i++) {
        this.oscs[i].frequency.setTargetAtTime(basePitch * multipliers[i], now, 0.6);
      }
    } else {
      this.padGain.gain.setTargetAtTime(0, now, 1.5);
    }
  }

  // ─── 麦克风实时互动 ───────────────────────────────────────

  async enableMic() {
    if (this.micEnabled) return true;
    if (!this.started) this.start();

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const src = this.ctx.createMediaStreamSource(this.micStream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = CONFIG.audio.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;
      src.connect(this.analyser);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.micEnabled = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  disableMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.analyser = null;
    this.micEnabled = false;
    this.level = 0;
    this.bands = [0, 0, 0];
  }

  /** 每帧调用：分析麦克风频谱，输出平滑能量 */
  analyze() {
    if (!this.micEnabled || !this.analyser) return;
    this.analyser.getByteFrequencyData(this.freqData);

    const bins = this.freqData.length;
    const bandSize = Math.floor(bins / 3);
    let sum = 0;
    const bands = [0, 0, 0];
    for (let i = 0; i < bins; i++) {
      const v = this.freqData[i] / 255;
      sum += v;
      const b = Math.min(2, Math.floor(i / bandSize));
      bands[b] += v;
    }
    const rms = sum / bins;
    bands[0] /= bandSize;
    bands[1] /= bandSize;
    bands[2] /= bandSize;

    // 平滑
    const s = CONFIG.audio.micSmoothing;
    this.level = this.level * s + rms * (1 - s);
    for (let i = 0; i < 3; i++) {
      this.bands[i] = this.bands[i] * s + bands[i] * (1 - s);
    }

    if (this._onLevel) this._onLevel(this.level, this.bands);
  }

  onLevel(fn) {
    this._onLevel = fn;
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  playCue(kind) {
    if(!this.ctx||this.ctx.state!=='running')return false;
    const score=SOUND_CUES[kind];if(score){const t=this.ctx.currentTime;
      for(let i=0;i<score.notes.length;i++){
        const o=this.ctx.createOscillator(),g=this.ctx.createGain(),at=t+i*.035;o.type='sine';o.frequency.setValueAtTime(score.notes[i],at);o.frequency.exponentialRampToValueAtTime(score.notes[i]*(score.slide||.985),at+score.duration*.85);
        g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(score.gain/(1+i*.7),at+.035);g.gain.exponentialRampToValueAtTime(.0001,at+score.duration);
        o.connect(g);g.connect(this.masterGain);this.cueNodes.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.cueNodes.delete(o);};o.start(at);o.stop(at+score.duration+.03);
      }return true;
    }
    const base={pickup:310,snap:587,light:784,chapter:440,puppet:260,curtain:180}[kind]||440;
    const t=this.ctx.currentTime;
    if(kind==='bird-call'){
      for(let i=0;i<3;i++){
        const o=this.ctx.createOscillator(),g=this.ctx.createGain(),at=t+i*.14;o.type='sine';o.frequency.setValueAtTime(1250+i*180,at);o.frequency.exponentialRampToValueAtTime(2400-i*120,at+.055);o.frequency.exponentialRampToValueAtTime(1150+i*100,at+.14);
        g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.055,at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+.17);o.connect(g);g.connect(this.masterGain);this.cueNodes.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.cueNodes.delete(o);};o.start(at);o.stop(at+.19);
      }return;
    }
    for(let i=0;i<(kind==='curtain'?4:2);i++){
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(base*[1,1.498,2.13,2.78][i],t);o.frequency.exponentialRampToValueAtTime(base*[.98,1.48,2.1,2.75][i],t+.7);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055/(i+1),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+(kind==='curtain'?1.5:.65));o.connect(g);g.connect(this.masterGain);this.cueNodes.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.cueNodes.delete(o);};o.start(t);o.stop(t+1.6);
    }
  }

  stopCues() { for(const o of this.cueNodes){try{o.stop();}catch{}o.onended?.();o.onended=null;}this.cueNodes.clear(); }

  setCueVolume(value){if(this.masterGain)this.masterGain.gain.value=Math.max(0,Math.min(1,value))*.5;}
  dispose(){this.stopCues();this.disableMic();for(const node of [...this.oscs,this.vibratoLfo])if(node){try{node.stop();}catch{}node.disconnect();}this.vibratoGain?.disconnect();this.masterGain?.disconnect();this.ambientGain?.disconnect();this.padGain?.disconnect();this.filter?.disconnect();this.ctx?.close();this.ctx=null;this.started=false;this.oscs=[];}

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
}
