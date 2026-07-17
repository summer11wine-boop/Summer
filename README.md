# Le Wine EDM 產生器｜上線教學（免費、不用寫程式）

這個資料夾是一個完整的小網站：同事只要打開網址、貼上商品連結，
就能自動抓取酒名、價格、評分、風味描述等資料，編輯後直接下載
可寄送的 EDM HTML 檔案。

整個部署過程不需要懂程式，跟著步驟做大約 10-15 分鐘可以完成。
以下用 **GitHub + Vercel**，兩個都是免費服務。

---

## 步驟一：註冊帳號（如果還沒有的話）

1. 到 https://github.com/signup 註冊一個 GitHub 帳號（用公司信箱即可）
2. 到 https://vercel.com/signup ，選擇「Continue with GitHub」，用剛剛的
   GitHub 帳號登入／授權

---

## 步驟二：把這個資料夾上傳到 GitHub

1. 登入 GitHub 後，右上角點「+」→「New repository」
2. Repository name 填 `lewine-edm-site`（或您喜歡的名字），Public 或
   Private 都可以，勾選都沒關係，直接按「Create repository」
3. 建立完成後，會看到一個「uploading an existing file」的連結，點下去
   （或在 repository 頁面點「Add file」→「Upload files」）
4. 把這個資料夾裡的所有檔案／資料夾（`index.html`、`package.json`、
   `api` 整個資料夾）拖曳進網頁上傳區塊
5. 下方填寫 commit message（隨便寫，例如「first upload」），按綠色的
   「Commit changes」

---

## 步驟三：用 Vercel 部署

1. 登入 https://vercel.com 後，點「Add New...」→「Project」
2. 在清單中找到剛剛建立的 `lewine-edm-site`，點「Import」
3. 設定畫面全部保持預設值就好，不用改任何東西，直接按「Deploy」
4. 等待約 30-60 秒，出現「Congratulations」畫面就代表成功了
5. 上面會有一個網址，長得像 `https://lewine-edm-site-xxxx.vercel.app`，
   這就是可以分享給大家的正式網址

---

## 步驟四：分享給同事

把 Vercel 給的網址（例如 `https://lewine-edm-site-xxxx.vercel.app`）
直接傳給同事即可，任何人打開都能：

1. 貼上商品頁連結 → 按「抓取酒款」
2. 檢查／修正自動帶入的欄位（**特別是年份跟價格，網站不一定抓得準**）
3. 需要的話可以「＋ 手動新增一款空白酒款」自己輸入
4. 上面可以切換 3 種配色
5. 按「下載完整 HTML」，就會拿到一份可以直接寄送的 EDM 檔案

---

## 之後要修改網站樣式怎麼辦？

如果之後想調整顏色、欄位、文字，可以直接回來這個 Claude 對話請我
修改 `index.html` 或 `api/parse.js`，改好後：

1. 到 GitHub 上的 repository，把改好的檔案重新上傳覆蓋（一樣用
   「Add file」→「Upload files」拖曳上傳）
2. Vercel 會自動偵測到 GitHub 有更新，幾十秒內自動重新部署，
   網址不會變，不用重新設定

---

## 常見問題

**Q：抓取結果不準確怎麼辦？**
A：不同酒商網站架構不一樣，抓取只是「草稿」，設計上就是要讓使用者
在下方欄位手動核對修正，尤其是年份和價格這種容易出錯、變動又快的
欄位，請務必人工確認一次再下載。

**Q：這個網址安全嗎？別人會不會亂改我們的資料？**
A：這個工具沒有資料庫、不會儲存任何人輸入的內容，每個人打開都是
全新的空白畫面，抓取的資料只存在使用者自己瀏覽器當下的畫面裡，
關掉分頁就消失了，不會互相影響或外洩。

**Q：Vercel 免費方案有限制嗎？**
A：免費方案（Hobby）對內部小型工具來說很足夠，一般公司內部使用
不會超過額度。如果之後同事很多、用量變大，再考慮升級付費方案即可。
