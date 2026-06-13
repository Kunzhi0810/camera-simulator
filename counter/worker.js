// 鏡頭模擬器人流計數 Worker
// 端點：
//   GET /hit  → 今日+1、總計+1，回傳 {today, total}
//   GET /get  → 只讀取，不增加（同訪客當日重複造訪用）
// 儲存：Cloudflare KV（綁定名稱 COUNTER）；「今日」以台灣時間 UTC+8 計算。
export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    };
    const path = new URL(request.url).pathname;

    // 台灣日期 YYYY-MM-DD
    const tw = new Date(Date.now() + 8 * 3600 * 1000);
    const dayKey = 'day:' + tw.toISOString().slice(0, 10);

    let total = parseInt((await env.COUNTER.get('total')) || '0', 10);
    let today = parseInt((await env.COUNTER.get(dayKey)) || '0', 10);

    if (path === '/hit') {
      total += 1;
      today += 1;
      await env.COUNTER.put('total', String(total));
      // 每日鍵保留 40 天後自動清除，避免 KV 累積無用資料
      await env.COUNTER.put(dayKey, String(today), { expirationTtl: 60 * 60 * 24 * 40 });
    }

    return new Response(JSON.stringify({ today, total }), { headers });
  }
};
