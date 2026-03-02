# GNote — 功能說明文件

> **版本**：v1.0
> **套件識別碼**：`com.chinhsiang.premiumnotes`
> **最後更新**：2026-03-01
---

## 📖 專案簡介

GNote 是一款仿 iPhone 備忘錄風格的高品質筆記應用程式，採用 React + Vite 開發，支援透過 Capacitor 打包為 Android APK。應用程式具有極簡奢華的 iOS 風格 UI、自動儲存、資料夾分類管理，以及基於 Google Firebase 的雲端同步與備忘錄分享功能。此外，更支援手機生辨識（指紋/面部）鎖定，提升筆記安全性。

---

## 🎨 設計風格

| 項目 | 說明 |
|------|------|
| **設計語言** | 仿 iOS 備忘錄風格，圓角卡片、毛玻璃效果 |
| **字型** | Outfit + 系統字型 (-apple-system, Segoe UI 等) |
| **主題色** | 橘金色系 (`#ff9500` 淺色 / `#ff9f0a` 暗色) |
| **暗黑模式** | 完整支援，跟隨系統 `prefers-color-scheme` 自動切換 |
| **動畫效果** | 使用 Framer Motion 實現頁面切換、彈窗、列表增刪等流暢動畫 |
| **圖示** | 使用 Lucide React 圖示庫 |

### 色彩配置

| CSS 變數 | 淺色模式 | 暗黑模式 |
|----------|----------|----------|
| `--bg-color` | `#f7f7f2` | `#000000` |
| `--surface-color` | `#ffffff` | `#1c1c1e` |
| `--text-primary` | `#1c1c1e` | `#ffffff` |
| `--text-secondary` | `#8e8e93` | `#8e8e93` |
| `--accent-color` | `#ff9500` | `#ff9f0a` |
| `--divider-color` | `#e5e5ea` | `#38383a` |

---

## 📂 專案結構

```
NoteApp/
├── index.html                  # 應用程式入口 HTML（含 viewport-fit=cover）
├── package.json                # NPM 套件設定
├── vite.config.js              # Vite 建構設定
├── capacitor.config.json       # Capacitor 設定（APK 打包用，含 GoogleAuth 配置）
├── GNote.apk                  # 最新打包完成的 Android APK
├── android/                    # Android 原生專案（Capacitor 產生）
│   └── app/
│       ├── build.gradle        # Android 建構設定（含從 local.properties 讀取的簽名配置）
│       └── release.p12         # ⭐ 通用簽章金鑰（PKCS#12 格式，請妥善備份！）
├── dist/                       # 建構產出目錄
├── public/                     # 靜態資源
└── src/
    ├── main.jsx                # React 應用程式進入點
    ├── App.jsx                 # 路由與頂層結構（含 Android 返回鍵處理）
    ├── App.css                 # 共用佈局樣式（標題列、底部工具列等）
    ├── index.css               # 全域樣式與 CSS 變數（含暗黑模式）
    ├── firebase.js             # Firebase 初始化設定檔
    ├── context/
    │   ├── AuthContext.jsx      # 使用者認證狀態管理（原生 Google 登入）
    │   └── NotesContext.jsx     # 備忘錄與資料夾狀態管理（含 Firestore 即時同步）
    └── views/
        ├── FoldersView.jsx      # 資料夾列表頁面
        ├── NotesListView.jsx    # 備忘錄列表頁面（卡片式設計）
        ├── EditorView.jsx       # 備忘錄編輯器頁面
        └── SettingsView.jsx     # 設定頁面
```

---

## ✨ 功能列表

### 1. 📁 資料夾管理

- **預設資料夾**：「全部」（首次安裝僅建立此資料夾）
- **新增資料夾**：底部「+ 新增資料夾」按鈕，透過 iOS 風格對話框輸入名稱
  - 防呆：不接受空白名稱或重複名稱
- **刪除資料夾**：進入編輯模式後，點擊紅色減號圖示刪除
  - 系統內建「全部」資料夾不可刪除
  - 刪除資料夾時，其中的備忘錄將自動移至「全部」
  - 刪除前有確認對話框，顯示將受影響的備忘錄數量
- **搜尋資料夾**：頂部搜尋列可即時過濾資料夾名稱
- **編輯模式**：點擊「編輯」按鈕切換，顯示/隱藏刪除按鈕；完成後點「完成」退出
- **資料夾專屬操作選單**：在自訂資料夾內的右上角選單 (`...`) 中，支援：
  - **重新命名資料夾**
  - **刪除資料夾**（直接透過該資料夾內的選單刪除）

### 2. 📝 備忘錄管理

- **新增備忘錄**：進入任一資料夾後，點擊右下角的鋼筆圖示建立新備忘錄
- **編輯備忘錄**：
  - **標題**：大字粗體輸入框，自動聚焦
  - **內容**：多行文字區域，自動填滿畫面剩餘空間
  - **自動儲存**：輸入後 500 毫秒自動儲存至本地與雲端（防抖設計）
- **刪除備忘錄**：
  - 編輯頁面頂部垃圾桶圖示，僅備忘錄擁有者可刪除
  - 已修正「刪除後備忘錄從雲端復活」的 Race Condition 問題
- **備忘錄列表**（卡片式設計）：
  - 顯示標題、更新日期、內容預覽（前 50 字元）
  - 每張卡片有 12px 間距，視覺清爽
  - 共享備忘錄會顯示共享標記圖示、權限說明與分享者名稱
  - 底部顯示該資料夾內的備忘錄總數
- **進階列表操作**（右上角 `...` 選單）：
  - **排序方式切換**：可切換「依日期排序 (新到舊/舊到新)」與「依標題排序 (A-Z)」
  - **批次選取模式**：開啟多選模式後，可一次選取多篇備忘錄進行「批次刪除」或「批次搬移」至其他資料夾
- **🔐 生物辨識鎖定 (Biometric Lock)**：
  - 在備忘錄編輯器右上角點擊🔒鎖頭圖示即可上鎖/解鎖。
  - 上鎖後的備忘錄在列表中會隱藏內容預覽，僅顯示「已上鎖🔒」。
  - 點擊時會要求驗證手機原生的指紋、臉部或系統密碼，驗證通過才可進入。
  - 鎖定狀態同步儲存於雲端資料庫。

### 3. 🔐 使用者認證（原生 Google 登入）

- **Google 帳號登入**：使用 `@codetrix-studio/capacitor-google-auth` 實現 Android 原生登入（非 WebView 彈出）
- **使用者資訊顯示**：
  - 登入後顯示使用者頭像、姓名、Email
  - 資料夾頁面右上角顯示頭像（未登入顯示人形圖示）
- **登出功能**：
  - 登出前有確認對話框
  - 登出後切換為離線模式，本地資料保留
- **Firebase 未設定提示**：若未配置 Firebase，設定頁面會顯示提示訊息

### 4. ☁️ 雲端同步

- **即時同步**：使用 Firestore `onSnapshot` 監聽，實現即時雙向同步
- **同步對象**：
  - 自己的備忘錄（依據 `ownerId` 篩選）
  - 資料夾設定（儲存於 `users/{uid}/config/folders`）
- **同步狀態指示**：設定頁面顯示同步狀態徽章
  - ☁️ `已同步`（綠色）
  - ☁️ `同步中...`（橘色 + 旋轉動畫）
  - 🔌 `離線模式`（灰色）
  - ❌ `同步失敗`（紅色）
- **離線支援**：資料同時儲存於 `localStorage`，未登入或離線時仍可正常使用
- **延遲同步**：編輯備忘錄時採用 800 毫秒防抖，避免頻繁寫入雲端

### 5. 🤝 備忘錄分享

- **分享功能**：
  - 在編輯頁面點擊分享圖示，開啟底部滑出式分享面板
  - 輸入對方的 Email 地址進行分享
  - 對方需要先登入過 App，系統才能找到其帳號
- **權限控制**：
  - **可編輯**：被分享者可修改備忘錄標題與內容
  - **僅檢視**：被分享者只能閱讀，不能編輯
- **分享管理**：
  - 只有**備忘錄建立者（擁有者）**可以看到分享按鈕並管理名單。
  - 查看已分享的使用者清單（顯示姓名/Email 與權限等級）。
  - 可個別移除已分享的使用者。
  - 編輯頁面頂部顯示共享人數指示。
- **與我共享**：
  - 資料夾頁面底部顯示「與我共享」區塊（有共享備忘錄時才出現）
  - 獨立的共享資料夾檢視，顯示來源者名稱與權限
  - 共享備忘錄不顯示新增按鈕
- **防呆機制**：不允許分享給自己

### 6. 📱 Android 原生功能

- **返回鍵處理**：
  - 非首頁時按返回鍵 → 返回上一頁
  - 首頁時按返回鍵 → 退出 App
- **Chrome Custom Tabs 防止**：使用原生 Google 登入，避免 WebView 跳轉問題
- **安全區域 (Safe Area) 處理**：正確避讓 Android 底部手勢操作列

### 7. ⚙️ 設定頁面

- **帳號管理**：登入 / 登出、使用者資訊顯示
- **同步狀態**：顯示目前的雲端同步狀態
- **隱私安全**：提示資料使用 Google Firebase 加密儲存
- **版本資訊**：顯示 `GNote v1.0`

---

## 🛠️ 技術架構

### 前端框架與工具

| 技術 | 版本 | 用途 |
|------|------|------|
| React | v19.2 | UI 框架 |
| Vite | v7.3 | 開發伺服器與建構工具 |
| React Router DOM | v7.13 | 前端路由 |
| Framer Motion | v12.34 | 動畫效果 |
| Lucide React | v0.575 | 圖示庫 |
| Firebase | v12.9 | 認證 + Firestore 資料庫 |
| Capacitor | v8.1 | 原生 Android 打包 |
| @codetrix-studio/capacitor-google-auth | v3.4.0-rc.4 | 原生 Google 登入 |
| @capgo/capacitor-native-biometric | v8.4.2 | 手機原生物辨識驗證 |
| @capacitor/app | v8.0.1 | Android 返回鍵、App 生命週期 |

### 後端服務（Firebase）

| 服務 | 用途 |
|------|------|
| **Firebase Authentication** | Google 帳號登入認證 |
| **Cloud Firestore** | 備忘錄與使用者資料的即時資料庫 |

### Firestore 資料結構

```
notes/{noteId}
├── title: string               # 備忘錄標題
├── content: string             # 備忘錄內容
├── folder: string              # 所屬資料夾名稱
├── ownerId: string             # 擁有者 UID
├── ownerEmail: string          # 擁有者 Email
├── ownerName: string           # 擁有者顯示名稱
├── sharedWith: map             # 已分享的使用者清單
│   └── {uid}: { email, displayName, permission }
├── sharedWithIds: array        # 已分享的使用者 UID 陣列（用於查詢）
└── updatedAt: timestamp        # 最後更新時間

users/{uid}
├── email: string               # 使用者 Email
├── displayName: string         # 使用者顯示名稱
├── photoURL: string            # 使用者頭像 URL
└── config/
    └── folders
        └── list: array         # 使用者的資料夾清單
```

---

## 🖥️ 頁面路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | FoldersView | 資料夾列表（首頁） |
| `/folder/:folderName` | NotesListView | 指定資料夾內的備忘錄列表 |
| `/note/:noteId` | EditorView | 備忘錄編輯器 |
| `/settings` | SettingsView | 設定頁面 |

---

## 🔑 Android 簽章金鑰與安全性 (Security)

本專案已升級至更具通用性的 **PKCS#12** 與 **安全性外部管理** 流程。

### 1. 安全性設定 (GitHub Secrets & local.properties)
為了保護金鑰密碼，敏感資訊已禁止上傳至 GitHub。
- **本地端**：管理於 `android/local.properties`。
- **雲端端 (GitHub Actions)**：需在 GitHub Repository Settings 中設定以下 Secrets：
  - `RELEASE_KEYSTORE_BASE64`：將 `release.p12` 轉為 Base64 字串。
  - `RELEASE_STORE_PASSWORD` / `RELEASE_KEY_ALIAS` / `RELEASE_KEY_PASSWORD`。

### 2. 禁忌清單 (絕對不可上傳至 GitHub)
- `android/app/release.p12` (數位簽章私鑰)
- `android/app/google-services.json` (Google/Firebase 私有設定)
- `local.properties` (本機路徑與密碼)
- `*.apk` (編譯產物，應存放於 Releases 區)

---

## 🚀 自動化建構與更新系統 (CI/CD)

本專案整合了 **GitHub Actions** 與 **原生更新檢查** 功能。

### 1. 如何發布新版本
1. 在 `package.json` 與 `android/app/build.gradle` 更新版本號（例如 `1.0.8`）。
2. 將程式碼推送到主分支 (`main`)。
3. 在本地執行：
   ```bash
   git tag v1.0.8
   git push origin v1.0.8
   ```
4. GitHub Actions 會自動啟動，編譯、簽名並產出 `GNote.apk` 到 GitHub Releases。

### 2. 原生更新機制 (Developer Note)
- **Plugin 註冊順序**：在 `MainActivity.java` 中，`registerPlugin(UpdatePlugin.class)` **必須** 放在 `super.onCreate(savedInstanceState)` 之「前」，否則會導致通訊橋樑建立失敗（錯誤代碼：`plugin is not implemented`）。
- **更新檢查流程**：App 啟動後可點擊設定頁面的「檢查更新」，透過 Native Bridge 請求 GitHub API，發現新版後會自動下載並啟動 Android `FileProvider` 進行現場安裝。

---

## 🚀 開發與部署

### 環境需求
- Node.js 22 (建議)
- Android Studio / JDK 21 (用於編譯自動簽名版本)

### 打包指令
```bash
# 同步 Web 至 Android
npm run build
npx cap sync android

# 本地編譯測試版
cd android
.\gradlew assembleDebug
```

---

## ⚡ 特色亮點
1. **正式版自動更新** — 內建透過 GitHub API 實現的最新版本檢查與自動安裝。
2. **極致安全自動化** — 所有的簽名過程都在 GitHub 加密環境完成，本機金鑰不離身。
3. **穩定的 APK 簽章** — 採用統一 PKCS#12 格式，換電腦開發也能產出可覆蓋更新的 APK。
4. **指紋/生物辨識安全** — 私密筆記可自訂鎖定。

