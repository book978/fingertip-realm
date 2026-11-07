export function createHandInput({ enterRatio = 0.28, exitRatio = 0.42, stableMs = 70 } = {}) {
  let pressed = false, candidate = null, since = 0, last = { x: 0, y: 0 };
  function reset() { pressed = false; candidate = null; since = 0; }
  return { reset, update(lm, timeMs) {
    const valid = lm?.length === 21 && lm.every(p => Number.isFinite(p?.x) && Number.isFinite(p?.y));
    const width = valid ? Math.hypot(lm[5].x - lm[17].x, lm[5].y - lm[17].y) : 0;
    if (!valid || width < 0.015) { candidate = null; return { ...last, source: 'camera', pressed: false, visible: false, timeMs }; }
    last = { x: Math.max(-1, Math.min(1, 1 - 2 * lm[8].x)), y: Math.max(-1, Math.min(1, 1 - 2 * lm[8].y)) };
    const ratio = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / width;
    const desired = pressed ? ratio < exitRatio : ratio < enterRatio;
    if (desired === pressed) candidate = null;
    else { if (candidate !== desired) { candidate = desired; since = timeMs; } if (timeMs - since >= stableMs) { pressed = desired; candidate = null; } }
    return { ...last, source: 'camera', pressed, visible: true, armAllowed: ratio >= exitRatio, timeMs };
  } };
}
