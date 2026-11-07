import { CONFIG, GESTURE_TO_MODE, MODE_LABEL } from './config.js?v=awakening1';
import { createHandInput } from './handInput.js?v=awakening1';
import { extractHandFeatures } from './handFeatures.js?v=awakening1';
const MP_VERSION = '0.4.1646424915';
export const GESTURE_EVENT = { GESTURE: 'gesture', SWIPE: 'swipe', HAND: 'hand', CAMERA: 'camera', INPUT: 'input' };

/** Owns one camera stream and a sequential MediaPipe inference loop. */
export class GestureController {
  constructor({ video, overlayCanvas = null, mediaDevices = globalThis.navigator?.mediaDevices, cameraManager=null,
    trackerFactory = async () => {
      if (!globalThis.Hands) throw new Error('手势模型未加载，请检查网络后重试');
      return new globalThis.Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MP_VERSION}/${f}` });
    }, requestFrame = fn => globalThis.requestAnimationFrame(fn), cancelFrame = id => globalThis.cancelAnimationFrame(id), now = () => performance.now() }) {
    Object.assign(this, { video, overlayCanvas, mediaDevices, cameraManager, trackerFactory, requestFrame, cancelFrame, now });
    this.cameraState = 'idle'; this.handVisible = false; this.handX = 0; this.handY = 0;
    this._listeners = {}; this._session = 0; this._starting = null; this._stream = null; this._tracker = null; this._frame = null;
    this._input = createHandInput();
  }
  on(event, fn) { (this._listeners[event] ||= []).push(fn); return this; }
  _emit(event, payload) { (this._listeners[event] || []).forEach(fn => fn(payload)); }
  _state(state) { this.cameraState = state; this._emit('camera', { state }); }
  start() {
    if (this._starting) return this._starting;
    if (this._stream && this.cameraState === 'tracking') return Promise.resolve(true);
    const session = ++this._session, pending = this._start(session);
    this._starting = pending;
    pending.finally(() => { if (this._starting === pending) this._starting = null; });
    return pending;
  }
  initMediaPipe() { return this.start(); }
  async _start(session) {
    this._state('requesting');
    try {
      if (!this.cameraManager&&!this.mediaDevices?.getUserMedia) throw new Error('摄像头不可用');
      const lease=this.cameraManager?await this.cameraManager.acquire('hands',this.video):null;
      const stream = this.cameraManager?lease?.stream:await this.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      if (!stream)return false;
      if (session !== this._session) { if(lease)lease.release();else stream.getTracks().forEach(t => t.stop()); return false; }
      this._lease=lease;
      this._stream = stream; this.video.srcObject = stream; this._state('loading');
      const tracker = await this.trackerFactory();
      if (session !== this._session) { await tracker.close?.(); return false; }
      this._tracker = tracker;
      tracker.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.55 });
      tracker.onResults(results => { if (session === this._session) this._onHandResults(results); });
      await tracker.initialize?.();
      if (session !== this._session) return false;
      await this.video.play();
      if (session !== this._session) return false;
      this._input.reset(); this._state('tracking');
      const loop = async () => {
        if (session !== this._session) return;
        try { if (this.video.readyState >= 2) { this._captureTime = this.now(); await tracker.send({ image: this.video }); } }
        catch { if (session === this._session) { await this.stop(); this._state('error'); } return; }
        if (session === this._session) this._frame = this.requestFrame(loop);
      };
      this._frame = this.requestFrame(loop); return true;
    } catch (err) {
      if (session === this._session) { await this.stop(); this._state(err?.name === 'NotAllowedError' ? 'denied' : 'error'); }
      return false;
    }
  }
  async stop() {
    ++this._session; this._starting = null;
    if (this._frame !== null) { this.cancelFrame(this._frame); this._frame = null; }
    const tracker = this._tracker; this._tracker = null;
    const stream = this._stream; this._stream = null;
    if(this._lease){this._lease.release();this._lease=null;}else stream?.getTracks().forEach(t => t.stop());
    this.cameraManager?.release('hands');
    this.video?.pause?.(); if (this.video) this.video.srcObject = null;
    this.handVisible = false; this._input.reset(); this._state('idle');
    this._emit('input', { source: 'camera', x: 0, y: 0, pressed: false, visible: false, timeMs: performance.now() });
    try { await tracker?.close?.(); } catch { /* The owned video tracks are already stopped. */ }
  }
  _onHandResults(results) {
    const lm = results.multiHandLandmarks?.[0], sample = this._input.update(lm, this._captureTime ?? this.now());
    sample.features = extractHandFeatures(lm, { pressed: sample.pressed });
    this.handVisible = sample.visible;
    if (sample.visible) { this.handX = sample.x * CONFIG.hand.scaleX / 2; this.handY = sample.y * CONFIG.hand.scaleY / 2; }
    this._emit('input', sample); this._emit('hand', { x: this.handX, y: this.handY, visible: sample.visible });
    if (lm) { const gesture = detectGesture(lm), mode = GESTURE_TO_MODE[gesture] || 'follow'; this._emit('gesture', { gesture, mode, label: MODE_LABEL[mode] }); }
    if (this.overlayCanvas && results.image) {
      const c = this.overlayCanvas, ctx = c.getContext('2d');
      if (c.width !== 640) { c.width = 640; c.height = 480; }
      ctx.drawImage(results.image, 0, 0, 640, 480);
      if (lm) { ctx.fillStyle = '#e4c98b'; for (const p of lm) { ctx.beginPath(); ctx.arc(p.x * 640, p.y * 480, 3.2, 0, Math.PI * 2); ctx.fill(); } }
    }
  }
  decayWhenIdle() { if (!this.handVisible) { this.handX *= 0.97; this.handY *= 0.97; } }
}
// Legacy discrete interface retained for the original experiment modules.
export function detectGesture(lm) {
  if (Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) < CONFIG.hand.pinchDist) return 'pinch';
  const [idx, mid, ring, pnk] = [[8,6],[12,10],[16,14],[20,18]].map(([tip,pip]) => lm[tip].y < lm[pip].y - CONFIG.hand.extendThreshold);
  const count = [idx,mid,ring,pnk].filter(Boolean).length;
  if (!count) return 'fist'; if (count === 4) return 'open';
  if (idx && !mid && !ring && !pnk) return 'point'; if (idx && mid && !ring && !pnk) return 'peace'; return 'default';
}
export const GESTURE_GUIDE = [
  { gesture: 'pinch', icon: 'pinch', name: '捏合', effect: '牵引器物部件' },
  { gesture: 'point', icon: 'point', name: '指向', effect: '探看形貌细节' },
  { gesture: 'open', icon: 'open', name: '松开', effect: '放置与复位' },
];
