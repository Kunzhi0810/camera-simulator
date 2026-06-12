window.Miniframe = (function () {
  'use strict';
  var TREE_Z = 9, TREE_X = -1.6; // 樹的世界座標（z 距離、橫向偏移，公尺）
  var CAM_H = 1.4;
  var el = {};
  function init() {
    ['mfPerson', 'mfTree', 'mfGround', 'mfLabel'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }
  // frac = 人物身高 / 畫面涵蓋高度；1/frac = 入鏡比例（0.5 → 腰部以上 = 半身）
  function classify(frac) {
    if (frac < 0.5) return '遠景';
    if (frac < 0.9) return '全身';
    if (frac < 1.7) return '七分身';
    if (frac < 2.6) return '半身';
    if (frac < 4) return '胸上';
    return '臉部特寫';
  }
  function update(s, d) {
    var FH = 120, FW = 180;
    // 人物：佔畫面高度比例 = 1.7 / 該距離畫面涵蓋高度
    var px = 1.7 / d.frameH * FH;           // 人物像素高
    var k = px / 170;                        // 局部座標縮放（人物圖 170 高）
    var feetY = FH / 2 + CAM_H / d.frameH * FH; // 地平線在中央，腳低於中央（相機高 1.4m）
    el.mfPerson.setAttribute('transform',
      'translate(' + (FW * 0.5 - 50 * k) + ',' + (feetY - 170 * k) + ') scale(' + k + ')');
    // 背景樹（高 5m，樹圖 250 高）
    var treeDist = TREE_Z - s.camZ;
    var fhT = Optics.frameHeightM(s.focal, d.sensor.h, treeDist);
    var pxT = 5 / fhT * FH, kT = pxT / 250;
    var feetT = FH / 2 + CAM_H / fhT * FH;
    var xT = FW * 0.5 + TREE_X / (fhT * 1.5) * FW; // 3:2 → 畫面寬 = 涵蓋高 ×1.5
    el.mfTree.setAttribute('transform',
      'translate(' + (xT - 50 * kT) + ',' + (feetT - 250 * kT) + ') scale(' + kT + ')');
    // 樹的失焦程度（依模糊圈），人物為對焦主體保持銳利
    var blur = Math.min(4, Optics.cocMM(s.focal, s.aperture, d.dist, treeDist) * 2.5);
    el.mfTree.style.filter = 'blur(' + blur.toFixed(2) + 'px)';
    el.mfGround.setAttribute('y', FH / 2);
    el.mfLabel.textContent = classify(1.7 / d.frameH);
  }
  return { init: init, update: update };
})();
