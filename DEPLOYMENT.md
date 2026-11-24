# HƯỚNG DẪN TRIỂN KHAI BOARD ARENA MIỄN PHÍ 100% (FREE DEPLOYMENT)

Dự án **BOARD ARENA** được thiết kế với kiến trúc **Full-stack Hybrid**, cho phép triển khai hoàn toàn miễn phí theo 2 mô hình phổ biến nhất hiện nay mà không tốn bất kỳ chi phí duy trì máy chủ nào.

---

## 🚀 CÁCH 1: TRIỂN KHAI 1-CLICK TẤT CẢ TRONG MỘT TRÊN RENDER (KHUYÊN DÙNG)
*Nền tảng Render (render.com) cung cấp gói Free Web Service hỗ trợ đầy đủ Node.js, WebSockets (Socket.io) và WebRTC signaling.*

### Các bước thực hiện:
1. **Đưa mã nguồn lên GitHub:**
   - Tạo một repository mới trên GitHub (ví dụ: `board-arena`).
   - Đẩy toàn bộ thư mục dự án lên GitHub.

2. **Tạo Web Service trên Render:**
   - Đăng nhập vào [Render.com](https://render.com) (bằng tài khoản GitHub).
   - Chọn **New +** ➔ **Web Service**.
   - Chọn repository `board-arena` của bạn.

3. **Cấu hình trên Render:**
   - **Name:** `board-arena`
   - **Environment:** `Node`
   - **Region:** `Singapore` (hoặc vùng gần bạn nhất để tối ưu ping)
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     cd server && npm install && cd ../client && npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     node server/src/index.js
     ```
   - **Instance Type:** `Free` (512 MB RAM, 0.1 CPU - miễn phí vĩnh viễn)

4. **Nhấn Deploy:**
   - Render sẽ tự động cài đặt thư viện, build bản React production (`client/dist`) và khởi chạy backend server.
   - Bạn sẽ nhận được đường dẫn dạng: `https://board-arena.onrender.com`.

---

## ⚡ CÁCH 2: TÁCH RIÊNG FRONTEND (VERCEL) + BACKEND (RENDER / RAILWAY)

### 1. Triển khai Frontend lên Vercel (Miễn phí, CDN toàn cầu siêu tốc):
- Đăng nhập [Vercel.com](https://vercel.com)
- Import repo `board-arena`
- Root Directory chọn: `client`
- Framework Preset: `Vite`
- Thêm biến môi trường:
  `VITE_SERVER_URL = https://board-arena-backend.onrender.com`
- Nhấn **Deploy** ➔ Có ngay tên miền `https://board-arena.vercel.app` tốc độ cực nhanh.

### 2. Triển khai Backend lên Render hoặc Railway:
- Root Directory: `server`
- Start Command: `node src/index.js`
- Biến môi trường: `PORT=4000`

---

## 🎙️ CẤU HÌNH VOICE CHAT (WEBRTC) MIỄN PHÍ
Hệ thống Voice Chat sử dụng WebRTC P2P (Peer-to-Peer):
- Dữ liệu âm thanh truyền trực tiếp giữa 2 trình duyệt của người chơi (không tốn băng thông máy chủ).
- STUN Server sử dụng dịch vụ STUN công cộng miễn phí toàn cầu của Google:
  * `stun:stun.l.google.com:19302`
  * `stun:stun1.l.google.com:19302`
  * `stun:stun2.l.google.com:19302`
- Không phát sinh chi phí NAT traversal.

---

## 💾 CƠ SỞ DỮ LIỆU MIỄN PHÍ
- Mặc định hệ thống sử dụng Database lưu trữ file nguyên tử (Atomic Local File Store) tự động tạo trong `server/data/db.json`.
- Nếu muốn scale nhiều container phân tán:
  * Kết nối miễn phí với **Supabase PostgreSQL** (Free 500MB) hoặc **Turso LibSQL** (Free 9GB).
