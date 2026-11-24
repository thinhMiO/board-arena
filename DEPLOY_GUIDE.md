# 🚀 HƯỚNG DẪN DEPLOY "BOARD ARENA" LÊN WEB MIỄN PHÍ 100%

Hệ thống **BOARD ARENA** được thiết kế theo kiến trúc hợp nhất (**Unified Fullstack App**):
Một Server Node.js duy nhất vừa phục vụ **Giao diện Web React SPA**, vừa xử lý **REST API**, vừa duy trì **WebSockets Socket.io** (kết nối thời gian thực, bàn cờ, phòng đấu, khán đài, bảng xếp hạng). Do đó, bạn có thể triển khai toàn bộ ứng dụng lên các nền tảng Cloud miễn phí chỉ với vài cú click chuột!

---

## 🏆 CÁCH 1: DEPLOY MIỄN PHÍ LÊN RENDER.COM (KHUYÊN DÙNG NHẤT)

Render.com cung cấp gói **Free Web Service** với 750 giờ/tháng, hỗ trợ đầy đủ WebSockets và cấp tên miền `https://...onrender.com` có chứng chỉ SSL miễn phí trọn đời.

### Các bước thực hiện:

1. **Đưa mã nguồn lên GitHub:**
   - Truy cập [github.com](https://github.com) và tạo một Repository mới (ví dụ đặt tên là `board-arena`).
   - Tải toàn bộ thư mục dự án lên Repository này.

2. **Tạo Web Service trên Render:**
   - Truy cập [render.com](https://render.com) và đăng ký/đăng nhập (bằng tài khoản GitHub).
   - Trên Dashboard, nhấn vào nút **"New +"** (góc trên bên phải) ➔ Chọn **"Web Service"**.
   - Chọn mục **"Build and deploy from a Git repository"** ➔ Chọn repository `board-arena` bạn vừa tải lên.

3. **Cấu hình thông số (File `render.yaml` đã được thiết lập sẵn):**
   - **Name:** `board-arena` (hoặc tên bạn muốn)
   - **Region:** `Singapore` (để tốc độ về Việt Nam nhanh nhất)
   - **Branch:** `main` (hoặc `master`)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (0$/tháng)

4. **Nhấn "Create Web Service":**
   - Render sẽ tự động kéo code, cài đặt thư viện, build giao diện React và khởi chạy máy chủ.
   - Sau khoảng 2 - 3 phút, bạn sẽ nhận được đường link web trực tiếp, ví dụ:
     👉 **`https://board-arena.onrender.com`**
   - Bạn có thể gửi đường link này cho bạn bè trên điện thoại hoặc máy tính để cùng đăng ký tài khoản, thi đấu và vào khán đài xem!

---

## ⚡ CÁCH 2: DEPLOY QUA DOCKER LÊN KOYEB (KHÔNG NGỦ ĐÔNG)

Koyeb cung cấp 1 dịch vụ miễn phí 24/7 (Free Eco Tier) và chạy trực tiếp file `Dockerfile` đã được tạo sẵn trong dự án:

1. Truy cập [koyeb.com](https://www.koyeb.com) và đăng ký tài khoản miễn phí.
2. Bấm **"Create App"** ➔ Chọn **GitHub**.
3. Chọn repo `board-arena`. Koyeb sẽ tự động nhận diện file [Dockerfile](file:///d:/Game/Dockerfile).
4. Đặt Port là `4000` (hoặc để mặc định).
5. Bấm **"Deploy"**. Sau khi build xong, bạn sẽ có link:
   👉 **`https://board-arena.koyeb.app`**

---

## 🌐 CÁCH 3: TẠO LINK TRỰC TIẾP NGAY BÂY GIỜ ĐỂ TEST CÙNG BẠN BÈ (LOCAL TUNNEL)

Nếu bạn muốn gửi link cho bạn bè chơi cùng **ngay lập tức trong 10 giây** mà chưa kịp tạo tài khoản Cloud:

1. Đảm bảo server đang chạy trên máy tính của bạn ở port 4000:
   ```bash
   npm start
   ```

2. Mở một cửa sổ Terminal/PowerShell mới và chạy lệnh:
   ```bash
   npx localtunnel --port 4000
   ```

3. Màn hình sẽ hiện ra một đường link công khai, ví dụ:
   `your url is: https://funny-board-42.loca.lt`
   - Gửi link này cho bạn bè là họ có thể truy cập thẳng vào trang web của bạn từ bất kỳ đâu qua mạng Internet!
