(function (global) {
  'use strict';

  var SENSORS = {
    ff:   { label: '全片幅', w: 36,   h: 24,   crop: 1.0, coc: 0.030 },
    apsc: { label: 'APS-C', w: 23.6, h: 15.7, crop: 1.5, coc: 0.020 },
    m43:  { label: 'M4/3',  w: 17.3, h: 13.0, crop: 2.0, coc: 0.015 }
  };

  // 視角（度）：sensorSide 用「寬」得水平視角、用「高」得垂直視角
  function fovDeg(focal, sensorSide) {
    return 2 * Math.atan(sensorSide / (2 * focal)) * 180 / Math.PI;
  }

  // 模糊圈直徑(mm)：s=對焦距離(m,可Infinity)、d=物距(m,可Infinity)
  function cocMM(focal, N, sM, dM) {
    if (!isFinite(sM) && !isFinite(dM)) return 0;
    if (!isFinite(sM)) return (focal * focal) / (N * dM * 1000);
    var s = sM * 1000;
    if (!isFinite(dM)) return (focal * focal) / (N * (s - focal));
    var d = dM * 1000;
    return (focal * focal / N) * Math.abs(d - s) / (d * (s - focal));
  }

  function hyperfocalM(focal, N, coc0) {
    return (focal * focal / (N * coc0) + focal) / 1000;
  }

  function dof(focal, N, sM, coc0) {
    var Hm = hyperfocalM(focal, N, coc0);
    if (!isFinite(sM)) return { nearM: Hm, farM: Infinity, totalM: Infinity, hyperfocalM: Hm };
    var H = Hm * 1000, s = sM * 1000, f = focal;
    var near = s * (H - f) / (H + s - 2 * f);
    var far = s >= H ? Infinity : s * (H - f) / (H - s);
    return {
      nearM: near / 1000,
      farM: isFinite(far) ? far / 1000 : Infinity,
      totalM: isFinite(far) ? (far - near) / 1000 : Infinity,
      hyperfocalM: Hm
    };
  }

  // 距離 d 處畫面涵蓋高度(m)（迷你取景框用）
  function frameHeightM(focal, sensorH, dM) {
    return 2 * dM * Math.tan(fovDeg(focal, sensorH) / 2 * Math.PI / 180);
  }

  global.Optics = { SENSORS: SENSORS, fovDeg: fovDeg, cocMM: cocMM,
    hyperfocalM: hyperfocalM, dof: dof, frameHeightM: frameHeightM };
})(typeof window !== 'undefined' ? window : globalThis);
