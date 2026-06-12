window.Tips = (function () {
  'use strict';
  var RULES = [
    { when: function (s, d) { return s.focal >= 85 && s.aperture <= 2.8; },
      text: function () { return '🎯 經典人像組合：長焦＋大光圈——清晰帶薄得只剩幾公分，背景完全融化。'; } },
    { when: function (s, d) { return s.focal <= 24 && d.dist < 1.2; },
      text: function () { return '⚠️ 廣角貼臉拍：透視誇張、五官變形。自拍距離建議換 35mm 以上焦段。'; } },
    { when: function (s, d) { return isFinite(d.dof.totalM) && d.dof.totalM < 0.15; },
      text: function (s, d) { return '🪶 景深只剩 ' + UI.fmtLen(d.dof.totalM, s.units) +
        '：看剪影——手上的東西清楚、臉卻糊了。對焦要對眼睛。'; } },
    { when: function (s) { return s.aperture >= 11; },
      text: function (s) { return '🏔 f/' + s.aperture +
        ' 小光圈前後都清楚，適合風景；但 f/16 以上會有繞射，畫質反而下降。'; } },
    { when: function (s, d) { return !isFinite(d.dof.farM); },
      text: function (s, d) { return '♾ 超焦距達成：從 ' + UI.fmtLen(d.dof.nearM, s.units) +
        ' 到無限遠全部清楚——風景攝影的對焦技巧。'; } },
    { when: function (s) { return s.sensor !== 'ff'; },
      text: function (s, d) { return '📐 同樣 ' + Math.round(s.focal) + 'mm 在 ' + d.sensor.label +
        ' 上等效 ' + Math.round(d.effFocal) + 'mm：片幅越小、視角越窄、景深越深。'; } }
  ];
  var DEFAULTS = [
    '💡 f 值越小＝光圈越大＝清晰帶越薄。',
    '💡 想要背景糊：光圈開大、焦段拉長、人離背景遠一點。',
    '💡 拖拖看相機和人物，注意粉紅帶的厚度變化。'];

  function render(s, d) {
    if (s.dollyRunning) return;
    var out = [];
    for (var i = 0; i < RULES.length && out.length < 2; i++) {
      if (RULES[i].when(s, d)) out.push(RULES[i].text(s, d));
    }
    if (!out.length) out.push(DEFAULTS[Math.floor(Date.now() / 8000) % DEFAULTS.length]);
    document.getElementById('tips').innerHTML =
      out.map(function (t) { return '<div class="tip">' + t + '</div>'; }).join('');
  }

  var CARDS = [
    { title: '① 焦段與視角', body: '焦距越長、視角錐越窄＝把畫面「裁切放大」。注意：拉焦段不會改變透視，只是看得更窄、更遠。',
      demo: function () { UI.set({ camZ: 0, subjectZ: 3, aperture: 4, focal: 16 });
        UI.toast('16mm 廣角：人物變小、背景變寬 → 1.8 秒後切 200mm');
        setTimeout(function () { UI.set({ focal: 200 }); UI.toast('200mm 望遠：同位置直接裁切放大'); }, 1800); } },
    { title: '② 光圈與景深', body: 'f 值越小＝光圈越大＝粉紅清晰帶越薄。薄到比身體還薄時，「對焦對在眼睛」就是這個原因。',
      demo: function () { UI.set({ camZ: 0, subjectZ: 1.5, focal: 85, aperture: 1.8 });
        UI.toast('85mm f/1.8 @1.5m：清晰帶只有 3 公分，比身體還薄'); } },
    { title: '③ 透視與距離', body: '背景被「壓縮拉近」不是焦段的魔法，而是距離：相機離人越遠，背景相對越大。Dolly Zoom 動畫一看就懂。',
      demo: function () { UI.startDolly(); } },
    { title: '④ 片幅等效', body: '同顆鏡頭裝在小片幅上，視角更窄（等效焦距×裁切係數）、同視角下景深更深。這就是手機拍不出單眼淺景深的主因之一。',
      demo: function () { UI.set({ camZ: 0, subjectZ: 2, focal: 50, aperture: 1.8, sensor: 'ff' });
        UI.toast('全片幅 50mm f/1.8');
        setTimeout(function () { UI.set({ sensor: 'apsc' }); UI.toast('APS-C：等效 75mm，景深變深'); }, 1500);
        setTimeout(function () { UI.set({ sensor: 'm43' }); UI.toast('M4/3：等效 100mm，景深更深'); }, 3000); } }
  ];
  function buildCards() {
    var box = document.getElementById('cards');
    CARDS.forEach(function (c) {
      var dt = document.createElement('details');
      dt.innerHTML = '<summary>' + c.title + '</summary><p>' + c.body +
        '</p><button class="mini demo">示範 ▶</button>';
      dt.querySelector('.demo').addEventListener('click', c.demo);
      box.appendChild(dt);
    });
  }
  return { render: render, buildCards: buildCards };
})();
