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
  initContactEmail();
  initCounter();
  if (location.search.indexOf('test=1') >= 0) setTimeout(selfTest, 300);
});

// 信箱防爬：執行時才組出地址，原始碼裡看不到完整 email
function initContactEmail() {
  var link = document.getElementById('mailLink');
  if (!link) return;
  var user = 'hmpowernet.ken', domain = 'gmail.com';
  var addr = user + '@' + domain;
  link.href = 'mailto:' + addr + '?subject=' + encodeURIComponent('關於鏡頭模擬器');
  link.title = addr;
}

// 人流統計：Cloudflare Worker 部署後把網址填進 COUNTER_API
var COUNTER_API = '';
function initCounter() {
  if (!COUNTER_API) return;                 // 尚未設定 → 不顯示
  var dayKey = 'cs_hit_' + new Date().toISOString().slice(0, 10);
  var path = localStorage.getItem(dayKey) ? '/get' : '/hit';   // 同一天只計一次
  fetch(COUNTER_API + path).then(function (r) { return r.json(); }).then(function (d) {
    if (typeof d.total !== 'number' || typeof d.today !== 'number') return;
    document.getElementById('statToday').textContent = d.today.toLocaleString();
    document.getElementById('statTotal').textContent = d.total.toLocaleString();
    document.getElementById('footStats').hidden = false;
    localStorage.setItem(dayKey, '1');
  }).catch(function () { /* 服務異常 → 靜默隱藏，不顯示壞數字 */ });
}

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
