# DatabaseDictionary

個人單機使用的資料庫中繼資料（Metadata）維護工具，用來取代人工手動撰寫／更新資料字典文件的方式。

集中維護資料庫內各種物件（Table／View／Function／Stored Procedure）的表頭資訊與欄位／參數明細，並提供對照實際資料庫結構、產生 T-SQL 指令等輔助功能。目前以 **SQL Server** 為主要支援對象。

## 技術架構

前後端完全分離，僅透過 HTTP/JSON REST API 溝通，未來可將前端整套替換為其他技術棧而後端不受影響。

| | |
|---|---|
| 前端 | Electron + React + TypeScript + Tailwind CSS + Zustand |
| 後端 | C# .NET 8 Web API + Dapper（存取 SQL Server） |

```
frontend  ── Electron 視窗 ── Vite/React SPA ──HTTP/JSON──▶  backend (ASP.NET Core Web API)
   │                                                              │
   └─ 啟動時自動 spawn 後端子行程，關閉視窗時一併結束 ──────────────┘
```

## 功能

- **資料檢索列**：依來源資料庫名稱、來源物件名稱、欄位名稱（反查所屬表頭）、全欄位模糊關鍵字，複選組合查詢（不分大小寫）
- **表頭／表身維護**：主從式結構，表身欄位依表頭「物件類型」動態顯示（Table／View 顯示 PK／自動遞增；Function／Stored Procedure 顯示參數方向 IN/OUT）
- **唯一性檢查**：資料庫主機＋來源資料庫名稱＋來源物件名稱組合不可重複
- **SQL 產生**（僅 Table）：CREATE TABLE、新增／修改／刪除欄位的 ALTER TABLE，皆以彈出視窗顯示文字供複製，系統本身不會對來源資料庫執行任何 SQL
- **比對實際資料庫差異**（僅 Table）：連線來源資料庫查詢實際結構，新增的欄位標記綠色、已不存在的欄位標記紅色刪除線，需使用者按「存檔」才正式寫入
- **程式使用清單**：維護「哪些程式使用到此物件」的清單，獨立於主表頭存檔動作
- **Grid 查詢列表**：查詢結果列表，雙擊或點擊物件名稱即可載入至維護頁籤

## 開始使用

### 事前準備

1. .NET 8 SDK、Node.js
2. 一台可連線的 SQL Server，用來存放本系統自身的中繼資料（表頭/表身/程式使用清單）—— 這是系統自己的資料庫，跟被記錄／被比對的「來源資料庫」是兩回事

### 設定連線字串

修改 [`backend/src/DatabaseDictionary.Api/appsettings.json`](backend/src/DatabaseDictionary.Api/appsettings.json) 的 `ConnectionStrings:DatabaseDictionary`：

```json
"ConnectionStrings": {
  "DatabaseDictionary": "Server=.;Database=DatabaseDictionary;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

資料庫與資料表會在後端第一次啟動時自動建立，不需要手動建置；若想先手動建好，可執行 [`backend/database/CreateDatabase.sql`](backend/database/CreateDatabase.sql)（與自動建置邏輯完全一致，可重複執行）。

> **關於連線帳密**：表頭上「連線資訊」用於「比對實際資料庫差異」功能，其中的密碼欄位目前是**明文儲存**於系統資料庫（非本 repo 内容，是執行時期產生的使用者資料）。若你修改 `appsettings.json` 改用 SQL 帳號密碼連線（而非預設的 Windows 整合驗證），**請勿把含有真實密碼的連線字串提交進 git**。

### 安裝與啟動

```bash
cd frontend
npm install
npm run electron:dev
```

`electron:dev` 會同時啟動 Vite 開發伺服器與 Electron；Electron 啟動時會自動以 `dotnet run` 拉起後端 API（監聽 `http://localhost:5230`，等待 `/health` 回應後才顯示視窗），關閉視窗時一併結束後端行程。

也可以單獨啟動後端做 API 測試（開發環境會提供 Swagger UI，網址 `http://localhost:5230/swagger`）：

```bash
cd backend/src/DatabaseDictionary.Api
dotnet run
```

## 打包成免安裝執行檔（Windows portable）

```bash
cd frontend
npm run dist
```

會依序執行：前端 `vite build` → 後端 `dotnet publish`（win-x64、self-contained、單一檔案，使用者電腦不需另外安裝 .NET Runtime）→ `electron-builder` 打包成免安裝的單一 exe。完成後在 `frontend/release/` 會產出 `DatabaseDictionary-<version>-portable.exe`，複製到任何 Windows 電腦上即可雙擊執行，不需安裝。

後端會以已發佈的 exe 型態隨 Electron 一起啟動／關閉，不需要目標電腦裝 .NET SDK；appsettings.json 會跟著一起打包，之後如需改連線字串，可在解壓後的 `resources/backend/appsettings.json` 修改。

> 打包出來的 exe 沒有數位簽章，使用者第一次執行 Windows SmartScreen 可能會跳警告，屬正常現象。

## 專案結構

```
backend/
├── database/CreateDatabase.sql          可選的手動建庫腳本
└── src/
    ├── DatabaseDictionary.Core/          領域實體、DTO、介面（不依賴 Dapper/ADO）
    ├── DatabaseDictionary.Infrastructure/ Dapper 存取邏輯、T-SQL 產生器、來源資料庫 Schema 比對
    └── DatabaseDictionary.Api/           ASP.NET Core Web API（Controller、DI、appsettings）
frontend/
├── electron/                             Electron main process（視窗管理、後端子行程生命週期）
└── src/                                  React + TypeScript SPA
```

## 尚未涵蓋範圍

以下項目本次尚未實作，留待後續確認：

- View／Function／Stored Procedure 的 SQL 產生功能（目前僅支援 Table）
- View／Function／Stored Procedure 的「比對實際資料庫差異」功能（目前僅支援 Table）
- SQL Server 以外的資料庫類型（MySQL、Oracle、PostgreSQL）
- Excel 匯出或既有資料字典匯入
