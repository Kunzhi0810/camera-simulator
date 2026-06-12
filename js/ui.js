window.UI = (function () {
  'use strict';
  var APERTURES = [1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  var FOCAL_CHIPS = [16, 24, 35, 50, 85, 135, 200];
  var PRESETS = [
    { label: '自拍臂距', d: 0.8, f: 24, N: 2 },
    { label: '半身人像', d: 1.5, f: 50, N: 1.8 },
    { label: '全身人像', d: 3, f: 85, N: 1.8 },
    { label: '街拍隨拍', d: 5, f: 35, N: 8 },
    { label: '風景全清晰', d: 8, f: 24, N: 8 }
  ];

  var state = { focal: 85, aperture: 1.8, sensor: 'ff',
    subjectZ: 3, camZ: 0, units: 'metric', dollyRunning: false };
  var subs = [], raf = 0;

  function derive(s) {
    var sen = Optics.SENSORS[s.sensor];
    var dist = s.subjectZ - s.camZ;
    return { sensor: sen, dist: dist,
      fovV: Optics.fovDeg(s.focal, sen.h), fovH: Optics.fovDeg(s.focal, sen.w),
      effFocal: s.focal * sen.crop,
      dof: Optics.dof(s.focal, s.aperture, dist, sen.coc),
      frameH: Optics.frameHeightM(s.focal, sen.h, dist) };
  }
  function set(patch) {
    Object.assign(state, patch);
    if (state.camZ > state.subjectZ - 0.5) state.camZ = state.subjectZ - 0.5;
    if (state.camZ < -20) state.camZ = -20;   // 預留 Dolly Zoom 後退空間（動畫終點上限 -18）
    if (state.subjectZ < state.camZ + 0.5) state.subjectZ = state.camZ + 0.5;
    if (state.subjectZ > 15) state.subjectZ = 15;
    notify();
  }
  function notify() {
    if (raf) return;
    var run = function () {
      raf = 0;
      var d = derive(state);
      subs.forEach(function (fn) { fn(state, d); });
    };
    // 背景分頁 rAF 不觸發 → 退用 setTimeout，前景照走 rAF（合併重繪）
    if (document.hidden) raf = setTimeout(run, 16);
    else raf = requestAnimationFrame(run);
  }

  // ---------- 格式化 ----------
  function fmtLen(m, units) {
    if (!isFinite(m)) return '∞';
    if (units === 'imperial') {
      var inch = m / 0.0254;
      if (inch < 12) return inch.toFixed(1) + '"';
      var ft = Math.floor(inch / 12), rest = Math.round(inch % 12);
      if (rest === 12) { ft += 1; rest = 0; }
      return ft + "' " + rest + '"';
    }
    if (m < 1) return Math.round(m * 100) + ' cm';
    return (m < 10 ? m.toFixed(2) : m.toFixed(1)) + ' m';
  }

  // ---------- 控制項綁定 ----------
  function $(id) { return document.getElementById(id); }
  function bind() {
    $('inDist').addEventListener('input', function () {
      set({ subjectZ: state.camZ + parseFloat(this.value) });
    });
    $('inFocal').addEventListener('input', function () { set({ focal: parseInt(this.value, 10) }); });
    $('inAperture').addEventListener('input', function () { set({ aperture: APERTURES[this.value] }); });
    FOCAL_CHIPS.forEach(function (f) {
      var b = document.createElement('button');
      b.textContent = f; b.dataset.f = f;
      b.addEventListener('click', function () { set({ focal: f }); });
      $('focalChips').appendChild(b);
    });
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.textContent = p.label;
      b.title = p.d + 'm · ' + p.f + 'mm · f/' + p.N;
      b.addEventListener('click', function () {
        set({ camZ: 0, subjectZ: p.d, focal: p.f, aperture: p.N });
      });
      $('presetChips').appendChild(b);
    });
    seg('sensorSeg', 'sensor'); seg('unitSeg', 'units');
    $('btnDolly').addEventListener('click', startDolly);
  }
  function seg(id, key) {
    var box = $(id);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      var patch = {}; patch[key] = b.dataset.v; set(patch);
    });
  }

  // ---------- 顯示更新（訂閱者） ----------
  function updateOutputs(s, d) {
    $('outDist').textContent = fmtLen(d.dist, s.units);
    $('outFocal').textContent = Math.round(s.focal) + 'mm';
    $('outAperture').textContent = 'f/' + s.aperture;
    if (document.activeElement !== $('inDist')) $('inDist').value = d.dist;
    if (document.activeElement !== $('inFocal')) $('inFocal').value = s.focal;
    var ai = APERTURES.indexOf(s.aperture);
    if (ai >= 0 && document.activeElement !== $('inAperture')) $('inAperture').value = ai;
    ['inDist', 'inFocal', 'inAperture'].forEach(function (id) {
      $(id).disabled = s.dollyRunning;   // Dolly 動畫中鎖定滑桿
    });
    document.querySelectorAll('#focalChips button').forEach(function (b) {
      b.classList.toggle('on', parseInt(b.dataset.f, 10) === Math.round(s.focal));
    });
    var u = s.units;
    $('dataPanel').innerHTML =
      item('近點', fmtLen(d.dof.nearM, u)) + item('遠點', fmtLen(d.dof.farM, u)) +
      item('總景深', fmtLen(d.dof.totalM, u)) + item('超焦距', fmtLen(d.dof.hyperfocalM, u)) +
      item('垂直視角', d.fovV.toFixed(1) + '°') +
      item('等效焦距', Math.round(d.effFocal) + 'mm');
    $('btnDolly').disabled = s.dollyRunning;
  }
  function item(k, v) { return '<div><b>' + v + '</b><span>' + k + '</span></div>'; }

  // ---------- Toast / 字卡 ----------
  var toastT = 0;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('hidden'); }, 2600);
  }
  function caption(msg) {
    var c = $('dollyCaption');
    if (!msg) { c.classList.add('hidden'); return; }
    c.textContent = msg; c.classList.remove('hidden');
  }

  // ---------- Dolly Zoom ----------
  function startDolly() {
    if (state.dollyRunning) return;
    var f0 = state.focal, cam0 = state.camZ, zs = state.subjectZ;
    var dist0 = zs - cam0;
    var fT = f0 < 60 ? 135 : 24;
    var sen = Optics.SENSORS[state.sensor];
    var tan0 = Math.tan(Optics.fovDeg(f0, sen.h) / 2 * Math.PI / 180);
    var tanT = Math.tan(Optics.fovDeg(fT, sen.h) / 2 * Math.PI / 180);
    if (fT < f0 && dist0 * tan0 / tanT < 0.6) { toast('把人物放遠一點，Dolly Zoom 效果更明顯'); return; }
    if (fT > f0) {
      // 終點相機位置不可低於 -18m：必要時自動降低目標焦距（tan(fovV/2)=sensorH/2f）
      var endCam = zs - dist0 * tan0 / tanT;
      if (endCam < -18) {
        var tanMin = dist0 * tan0 / (zs + 18);
        fT = Math.min(135, sen.h / (2 * tanMin));
        tanT = Math.tan(Optics.fovDeg(fT, sen.h) / 2 * Math.PI / 180);
      }
    }
    var frac0 = 1.7 / Optics.frameHeightM(f0, sen.h, dist0);
    set({ dollyRunning: true });
    caption('注意背景的樹！人物大小不變，背景卻被拉近／推遠——透視只取決於相機到人物的距離，焦段只是裁切。');
    function apply(p) {
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var f = f0 + (fT - f0) * e;
      var th = Math.tan(Optics.fovDeg(f, sen.h) / 2 * Math.PI / 180);
      Object.assign(state, { focal: f, camZ: zs - dist0 * tan0 / th });
      notify();
      var frac = 1.7 / Optics.frameHeightM(f, sen.h, zs - state.camZ);
      console.assert(Math.abs(frac - frac0) / frac0 < 0.01, 'Dolly：人物取景佔比應恆定');
    }
    function finish() {
      set({ dollyRunning: false });
      var rb = $('btnDollyReset');
      rb.classList.remove('hidden');
      rb.onclick = function () {
        set({ focal: f0, camZ: cam0 }); rb.classList.add('hidden'); caption(null);
      };
      setTimeout(function () { caption(null); }, 2500);
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var steps = [0, 0.5, 1], i = 0;
      (function next() { apply(steps[i]); i += 1;
        if (i < steps.length) setTimeout(next, 1200); else finish(); })();
    } else {
      var T = 4000, t0 = performance.now();
      var tick = document.hidden
        ? function (cb) { setTimeout(function () { cb(performance.now()); }, 16); }
        : function (cb) { requestAnimationFrame(cb); };
      (function frame(now) {
        var p = Math.min(1, (now - t0) / T);
        apply(p);
        if (p < 1) tick(frame); else finish();
      })(t0);
    }
  }

  return { state: function () { return state; }, derive: derive, set: set,
    subscribe: function (fn) { subs.push(fn); }, bind: bind,
    updateOutputs: updateOutputs, fmtLen: fmtLen, toast: toast, caption: caption,
    startDolly: startDolly, APERTURES: APERTURES, PRESETS: PRESETS };
})();
