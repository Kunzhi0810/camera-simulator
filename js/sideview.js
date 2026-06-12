window.Sideview = (function () {
  'use strict';
  var GROUND_Y = 408, TOP_Y = 64, TREE_Z = 9, CAM_H = 1.4;
  var el = {};
  var IDS = ['cone', 'ruler', 'bandRect', 'dofClipRect', 'nearLine', 'farLine', 'nearLabel',
    'farLabel', 'infLabel', 'treeG', 'treeBlur', 'treeSharp', 'personG', 'personBlur',
    'personSharp', 'heightLabel', 'camG', 'camBody', 'tripod', 'camHit', 'camHint',
    'dofArrowLine', 'dofText', 'sideview'];

  function init() {
    IDS.forEach(function (id) { el[id] = document.getElementById(id); });
  }
  function win(s) {
    var lo = Math.min(-2, s.camZ - 1.2), hi = Math.max(11, s.subjectZ + 2.5);
    var S = 920 / (hi - lo);
    return { lo: lo, hi: hi, S: S,
      x: function (w) { return 40 + (w - lo) * S; } };
  }
  function update(s, d) {
    var W = win(s), S = W.S;
    var ax = W.x(s.camZ), ay = GROUND_Y - CAM_H * S;

    // 視角錐（垂直 FOV，向右張開）
    var t = Math.tan(d.fovV / 2 * Math.PI / 180);
    var dx = 1000 - ax;
    el.cone.setAttribute('points',
      ax + ',' + ay + ' 1000,' + (ay - dx * t) + ' 1000,' + (ay + dx * t));

    // 清晰帶 + clip
    var nx = W.x(s.camZ + d.dof.nearM);
    var fx = isFinite(d.dof.farM) ? W.x(s.camZ + d.dof.farM) : 1010;
    el.bandRect.setAttribute('x', nx);
    el.bandRect.setAttribute('width', Math.max(0, fx - nx));
    el.dofClipRect.setAttribute('x', nx);
    el.dofClipRect.setAttribute('width', Math.max(0, fx - nx));
    el.nearLine.setAttribute('x1', nx); el.nearLine.setAttribute('x2', nx);
    el.farLine.setAttribute('x1', Math.min(fx, 1000)); el.farLine.setAttribute('x2', Math.min(fx, 1000));
    var fxc = Math.min(fx, 960);
    if (isFinite(d.dof.farM) && fxc - nx < 130) {
      // 帶太窄 → 合併為單一標籤置中，避免重疊
      el.nearLabel.setAttribute('x', (nx + fxc) / 2);
      el.nearLabel.textContent = '清晰範圍 ' + UI.fmtLen(d.dof.nearM, s.units) +
        ' – ' + UI.fmtLen(d.dof.farM, s.units);
      el.farLabel.textContent = '';
    } else {
      el.nearLabel.setAttribute('x', nx);
      el.nearLabel.textContent = '近點 ' + UI.fmtLen(d.dof.nearM, s.units);
      el.farLabel.setAttribute('x', fxc);
      el.farLabel.textContent = isFinite(d.dof.farM) ? '遠點 ' + UI.fmtLen(d.dof.farM, s.units) : '';
    }
    el.infLabel.classList.toggle('hidden', isFinite(d.dof.farM));

    // 總景深箭頭
    el.dofArrowLine.setAttribute('x1', nx);
    el.dofArrowLine.setAttribute('x2', Math.min(fx, 1000));
    el.dofText.setAttribute('x', (nx + Math.min(fx, 1000)) / 2);
    el.dofText.textContent = '總景深 ' + UI.fmtLen(d.dof.totalM, s.units);

    // 人物（100×170 局部座標，1unit=1cm；中心=世界 subjectZ）
    // 清晰層在根座標系群組內被 dofClip 剪裁，需個別套相同 transform
    var personT = 'translate(' + (W.x(s.subjectZ) - 0.5 * S) +
      ',' + (GROUND_Y - 1.7 * S) + ') scale(' + (S / 100) + ')';
    el.personG.setAttribute('transform', personT);
    el.personSharp.setAttribute('transform', personT);
    el.heightLabel.setAttribute('x', W.x(s.subjectZ) + 0.55 * S);
    el.heightLabel.setAttribute('y', GROUND_Y - 1.7 * S - 6);
    el.heightLabel.textContent = UI.fmtLen(1.7, s.units);

    // 背景樹（100×250 局部座標，1unit=2cm；中心=世界 TREE_Z）
    var treeT = 'translate(' + (W.x(TREE_Z) - 1.0 * S) +
      ',' + (GROUND_Y - 5 * S) + ') scale(' + (S / 50) + ')';
    el.treeG.setAttribute('transform', treeT);
    el.treeSharp.setAttribute('transform', treeT);

    // 柔焦量（CSS blur，依實際模糊圈：剪影前緣手持物 / 樹的位置）
    el.personBlur.style.filter = 'blur(' +
      clampB(Optics.cocMM(s.focal, s.aperture, d.dist, Math.max(0.2, d.dist - 0.35))) + 'px)';
    el.treeBlur.style.filter = 'blur(' +
      clampB(Optics.cocMM(s.focal, s.aperture, d.dist, TREE_Z - s.camZ)) + 'px)';

    // 相機（120×80 局部座標，鏡頭前緣 (112,41) 對齊世界 camZ、高 CAM_H）
    var k = 0.55 * S / 120;
    el.camBody.setAttribute('transform',
      'translate(' + (ax - 112 * k) + ',' + (ay - 41 * k) + ') scale(' + k + ')');
    el.tripod.setAttribute('x1', ax - 70 * k); el.tripod.setAttribute('x2', ax - 70 * k);
    el.tripod.setAttribute('y1', ay + 23 * k); el.tripod.setAttribute('y2', GROUND_Y);
    el.camHit.setAttribute('x', ax - 130 * k); el.camHit.setAttribute('y', ay - 60 * k);
    el.camHit.setAttribute('width', 160 * k); el.camHit.setAttribute('height', 120 * k + (GROUND_Y - ay));
    el.camHint.setAttribute('x', ax); el.camHint.setAttribute('y', ay - 60 * k - 8);

    ruler(W, s);
  }
  function clampB(cocMM) { return Math.min(7, Math.max(1.2, cocMM * 6)).toFixed(2); }

  function ruler(W, s) {
    var html = '';
    var maxD = Math.ceil(W.hi - s.camZ);
    for (var i = 1; i <= maxD; i++) {
      var x = W.x(s.camZ + i);
      if (x > 995) break;
      var big = i % 5 === 0;
      html += '<line x1="' + x + '" y1="' + GROUND_Y + '" x2="' + x + '" y2="' +
        (GROUND_Y + (big ? 12 : 6)) + '" stroke="#9aa0a6" stroke-width="1"/>';
      if (big) html += '<text class="svg-lbl" text-anchor="middle" x="' + x + '" y="' +
        (GROUND_Y + 28) + '">' + UI.fmtLen(i, s.units) + '</text>';
    }
    el.ruler.innerHTML = html;
  }
  // 拖曳：人物 / 相機（pointer events，滑鼠與觸控通用）
  function bindDrag() {
    var svg = el.sideview, target = null, hinted = false;
    function evX(ev) {
      var r = svg.getBoundingClientRect();
      return (ev.clientX - r.left) / r.width * 1000;
    }
    function down(id, name) {
      el[id].addEventListener('pointerdown', function (ev) {
        if (UI.state().dollyRunning) return;
        target = name; ev.preventDefault();
        try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* 合成事件無作用中指標 */ }
        if (!hinted) { hinted = true; el.camHint.classList.add('hidden'); }
      });
    }
    down('personG', 'person'); down('camHit', 'cam');
    svg.addEventListener('pointermove', function (ev) {
      if (!target) return;
      var s = UI.state(), W = win(s);
      var w = W.lo + (evX(ev) - 40) / W.S;
      if (target === 'person') UI.set({ subjectZ: w });
      else UI.set({ camZ: w });
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      svg.addEventListener(t, function () { target = null; });
    });
  }

  return { init: init, update: update, win: win, bindDrag: bindDrag };
})();
