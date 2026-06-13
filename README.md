# 📷 鏡頭模擬器——一張圖看懂景深

互動式攝影教學網頁：側視示意圖即時顯示「清晰範圍」（粉紅帶），
拖動相機與人物、調整焦段／光圈／片幅，3 秒看懂景深、透視與取景。

## 功能

- **側視圖**：相機（可拖）、視角錐、人物剪影（可拖）、粉紅清晰帶——身體在帶內的部位銳利深色、帶外淡灰模糊
- **迷你取景框**：即時顯示取景裁切（遠景／全身／七分身／半身／胸上／臉部特寫）與背景虛化
- **Dolly Zoom 一鍵示範**：人物大小不變、背景拉近推遠——理解「透視只取決於距離」
- **片幅比較**：全片幅／APS-C／M4/3 等效焦距與景深差異
- **教學層**：依參數變化的動態提示 + 4 張知識卡（一鍵示範）
- 公制／英制切換、場景預設、RWD 手機可用、零依賴零建置

## 使用

- 線上 Demo：**https://kunzhi0810.github.io/camera-simulator/**
- 本機：雙擊 `index.html` 即可

## 部署到 GitHub Pages

1. GitHub 開新 repo（例如 `camera-simulator`）
2. `git remote add origin https://github.com/<帳號>/camera-simulator.git`
3. `git push -u origin main`
4. Repo → Settings → Pages → Source 選 `main` / root → 存檔，幾分鐘後取得網址

## 光學公式（皆為真實薄透鏡模型）

- 視角 `FOV = 2·atan(片幅邊長/2f)`
- 模糊圈 `c = (f²/N)·|d−s| / (d·(s−f))`
- 超焦距 `H = f²/(N·c₀)+f`；近點 `s(H−f)/(H+s−2f)`；遠點 `s(H−f)/(H−s)`
- 容許模糊圈 c₀：FF 0.030 / APS-C 0.020 / M4/3 0.015 mm

## 測試

- `node tests/optics.test.js`（15 項光學基準斷言）
- 瀏覽器開 `index.html?test=1`（console 自我檢核，含畫面與數據一致性）

## 致謝

介面概念啟發自 Jack Herrington 的 depth-of-field 工具；本專案為獨立實作，
未使用其程式碼或圖形資產。
