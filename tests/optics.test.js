require('../js/optics.js');
const assert = require('node:assert');
const O = globalThis.Optics;

let n = 0;
function approx(actual, expected, tolPct, msg) {
  n++;
  const tol = Math.abs(expected) * tolPct;
  assert.ok(Math.abs(actual - expected) <= tol,
    `${msg}: got ${actual}, want ${expected} ±${tolPct * 100}%`);
}

approx(O.fovDeg(50, 36), 39.6, 0.01, 'FF 50mm 水平視角');
approx(O.fovDeg(16, 36), 96.7, 0.01, 'FF 16mm 水平視角');
approx(O.fovDeg(200, 36), 10.29, 0.01, 'FF 200mm 水平視角');
approx(O.fovDeg(50, 23.6), 26.6, 0.01, 'APS-C 50mm 水平視角');

const d1 = O.dof(85, 1.8, 3, 0.030);
approx(d1.nearM, 2.936, 0.02, '85/1.8@3m 近點');
approx(d1.farM, 3.067, 0.02, '85/1.8@3m 遠點');
approx(d1.totalM, 0.131, 0.05, '85/1.8@3m 總景深');

const d2 = O.dof(50, 8, 5, 0.030);
approx(d2.nearM, 3.389, 0.02, '50/8@5m 近點');
approx(d2.farM, 9.527, 0.02, '50/8@5m 遠點');

approx(O.hyperfocalM(24, 8, 0.030), 2.424, 0.02, '24/8 超焦距');
const d3 = O.dof(24, 8, 2.424, 0.030);
approx(d3.nearM, 1.212, 0.02, '對焦超焦距 → 近點 = H/2');
assert.strictEqual(d3.farM, Infinity, '對焦超焦距 → 遠點 ∞');

approx(O.cocMM(85, 1.8, 3, 9), 0.918, 0.02, 'CoC 背景樹 9m');
approx(O.cocMM(24, 8, Infinity, 2.424), 0.030, 0.03, '對焦∞、物在 H → c0');
approx(O.frameHeightM(85, 24, 3), 0.847, 0.01, '85mm@3m 畫面涵蓋高度');

console.log(`✓ optics.test.js ${n} 項斷言全部通過`);
