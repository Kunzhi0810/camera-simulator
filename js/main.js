window.addEventListener('DOMContentLoaded', function () {
  UI.bind();
  Sideview.init();
  Sideview.bindDrag();
  Miniframe.init();
  Tips.buildCards();
  UI.subscribe(UI.updateOutputs);
  UI.subscribe(Sideview.update);
  UI.subscribe(Miniframe.update);
  UI.subscribe(Tips.render);
  UI.set({});
  if (location.search.indexOf('test=1') >= 0) setTimeout(selfTest, 300);
});

// 瀏覽器自我檢核：index.html?test=1，結果輸出到 console
function selfTest() {
  var ok = 0, fail = 0;
  function approx(a, e, tol, msg) {
    if (Math.abs(a - e) <= Math.abs(e) * tol) { ok += 1; }
    else { fail += 1; console.error('✗', msg, 'got', a, 'want', e); }
  }
  var O = Optics;
  approx(O.fovDeg(50, 36), 39.6, 0.01, 'FOV 50mm');
  var d1 = O.dof(85, 1.8, 3, 0.030);
  approx(d1.nearM, 2.936, 0.02, 'DOF 近點');
  approx(d1.farM, 3.067, 0.02, 'DOF 遠點');
  approx(O.hyperfocalM(24, 8, 0.030), 2.424, 0.02, '超焦距');
  // 畫面一致性：清晰帶 SVG 座標 vs 光學數據
  UI.set({ camZ: 0, subjectZ: 3, focal: 85, aperture: 1.8, sensor: 'ff' });
  setTimeout(function () {
    var s = UI.state(), d = UI.derive(s), W = Sideview.win(s);
    var nx = parseFloat(document.getElementById('bandRect').getAttribute('x'));
    approx(nx, W.x(s.camZ + d.dof.nearM), 0.001, '清晰帶 SVG 座標 = 光學近點');
    console.log('selfTest：' + ok + ' 通過 / ' + fail + ' 失敗');
  }, 200);
}
