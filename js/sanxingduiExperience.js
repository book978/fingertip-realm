const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const copy = (p) => ({ x: p.x, y: p.y });
/** Theme state is independent of rendering, DOM and input hardware. */
export function createExperience({ parts, snapRadius = 3.2, lossGraceMs = 300 }) {
  let state, down, armed, offset, lostAt, rotationStart, source = 'pointer', dwell;
  function reset() {
    state = { phase: 'assemble', parts: parts.map(p => ({ id: p.id, position: copy(p.initial), placed: false })), grabbedId: null, hoveredId: null, snapPreviewId: null, progress: 0, yaw: 0, pitch: 0, zoom: 1, hotspotId: null };
    down = false; armed = source === 'pointer'; offset = { x: 0, y: 0 }; lostAt = null; rotationStart = null; dwell = null;
  }
  function cancel() { state.grabbedId = null; state.snapPreviewId = null; down = false; armed = false; rotationStart = null; }
  function tick(timeMs) { if (lostAt !== null && timeMs - lostAt >= lossGraceMs) cancel(); }
  function handleInput(s, probe) {
    if (!s.visible) { if (lostAt === null) lostAt = s.timeMs; tick(s.timeMs); return; }
    if (lostAt !== null) { tick(s.timeMs); lostAt = null; }
    if (!Number.isFinite(probe.point?.x) || !Number.isFinite(probe.point?.y)) return;
    if (!s.pressed && s.armAllowed !== false) armed = true;
    state.hoveredId = probe.partId;
    const start = s.pressed && !down && armed;
    if (state.phase === 'assemble') {
      if (start) {
        const p = state.parts.find(p => p.id === probe.partId && !p.placed);
        if (p) { state.grabbedId = p.id; offset = { x: p.position.x - probe.point.x, y: p.position.y - probe.point.y }; }
      }
      if (state.grabbedId) {
        const p = state.parts.find(p => p.id === state.grabbedId);
        p.position = { x: clamp(probe.point.x + offset.x, -44, 44), y: clamp(probe.point.y + offset.y, -28, 28) };
        const target = parts.find(t => t.id === p.id).target;
        const near = Math.hypot(p.position.x - target.x, p.position.y - target.y) <= snapRadius;
        state.snapPreviewId = near ? p.id : null;
        if (!s.pressed && down) {
          if (near) { p.position = copy(target); p.placed = true; state.progress++; }
          state.grabbedId = null; state.snapPreviewId = null;
          if (state.progress === parts.length) state.phase = 'reveal';
        }
      }
    } else if (state.phase === 'inspect') {
      if (start && probe.partId) rotationStart = { x: s.x, y: s.y, yaw: state.yaw, pitch: state.pitch };
      if (rotationStart && s.pressed) {
        state.yaw = clamp(rotationStart.yaw + (s.x - rotationStart.x) * 2, -0.8, 0.8);
        state.pitch = clamp(rotationStart.pitch - (s.y - rotationStart.y), -0.3, 0.3);
      }
      if (!s.pressed) rotationStart = null;
      if (!s.pressed && probe.hotspotId) {
        if (dwell?.id !== probe.hotspotId) dwell = { id: probe.hotspotId, since: s.timeMs };
        if (s.timeMs - dwell.since >= 450) state.hotspotId = dwell.id;
      } else dwell = null;
    }
    down = s.pressed;
  }
  reset();
  return {
    handleInput, tick, reset,
    cancelInput() { cancel(); lostAt=null; dwell=null; armed=source==='pointer'; },
    restore(saved) { reset(); if(!saved?.parts)return; for(const p of state.parts){const v=saved.parts.find(q=>q.id===p.id);if(v&&Number.isFinite(v.position?.x)&&Number.isFinite(v.position?.y)){p.position={x:clamp(v.position.x,-44,44),y:clamp(v.position.y,-28,28)};p.placed=!!v.placed;}}state.progress=state.parts.filter(p=>p.placed).length;state.phase=state.progress===parts.length?(saved.phase==='inspect'?'inspect':'reveal'):'assemble';state.yaw=clamp(saved.yaw||0,-.8,.8);state.pitch=clamp(saved.pitch||0,-.3,.3);state.zoom=clamp(saved.zoom||1,.8,1.35);state.hotspotId=saved.hotspotId||null; },
    setInputSource(value) { source = value; cancel(); armed=value==='pointer'; lostAt = null; },
    finishReveal() { if (state.phase === 'reveal') state.phase = 'inspect'; },
    setZoom(v) { if (Number.isFinite(v)) state.zoom = clamp(v, 0.8, 1.35); },
    faceFront() { state.yaw = 0; state.pitch = 0; state.zoom = 1; },
    selectHotspot(id) { state.hotspotId = id; },
    getSnapshot() { return { ...state, complete:state.phase==='inspect', inputSource: source, parts: state.parts.map(p => ({ ...p, position: copy(p.position) })) }; },
  };
}
