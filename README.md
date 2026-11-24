# BOARD ARENA – NỀN TẢNG CHƠI CỜ ĐA TRÒ CHƠI

**BOARD ARENA** là nền tảng game cờ trực tuyến hiện đại, cho phép người chơi đăng nhập duy nhất một tài khoản và trải nghiệm hầu hết các môn cờ phổ biến nhất trên thế giới và cờ dân gian truyền thống Việt Nam.

---

## 🎮 CÁC LOẠI CỜ HỖ TRỢ SẴN CÓ:

1. **Cờ Vua (Chess)**: Chuẩn FIDE quốc tế, 8x8, nhập thành, bắt tốt qua đường, phong cấp tốt, kiểm tra chiếu và chiếu hết.
2. **Cờ Tướng (Xiangqi)**: 9x10, Sông Sở Hà, Cung cấm, cản chân Mã, cản mắt Tượng, Pháo nhảy ăn quân, chống lộ mặt Tướng.
3. **Cờ Vây (Go / Weiqi / Baduk)**: Bàn 9x9, 13x13, 19x19, tính khí, vây bắt quân, luật Ko (kiếp), đếm đất lãnh thổ.
4. **Cờ Caro (Gomoku)**: Bàn 15x15 và 19x19, luật tự do hoặc luật chặn 2 đầu truyền thống Việt Nam.
5. **Cờ Đam (Checkers / Draughts)**: Bàn 8x8, đi chéo, nhảy ăn quân bắt buộc, phong Vua khi tiến tới hàng cuối.
6. **Cờ Lật (Othello / Reversi)**: Bàn 8x8, kẹp quân 8 hướng để lật cờ đối thủ về phe mình, cơ chế bỏ lượt (pass).
7. **Cờ 4 (Connect Four)**: Bàn 7x6, thả quân theo trọng lực, xếp 4 quân thẳng hàng (ngang, dọc, chéo).
8. **Cờ Tướng Nhật Bản (Shogi)**: Bàn 9x9, phong cấp quân khi tiến vào 3 hàng đối phương, tái sử dụng quân bắt được (thả quân).
9. **Cờ Gánh (Dân gian Việt Nam)**: Bàn 5x5 có đường chéo, cơ chế "Gánh" (kẹp giữa 2 quân địch) và "Vây" (chẹt hết đường đi).
10. **Cờ Ô Ăn Quan (Dân gian Việt Nam)**: 10 ô dân và 2 ô quan bán nguyệt, rải quân thuận/nghịch chiều kim đồng hồ, ăn quan, ăn dân liên hoàn.
11. **Cờ Cá Ngựa (Ludo / Horse Race)**: 4 màu chuồng, gieo xúc xắc, xuất quân, đá ngựa đối thủ, leo bậc đích 1-6.
12. **Cờ Chín Quân (Nine Men's Morris)**: 24 điểm trên 3 hình vuông đồng tâm, giai đoạn đặt quân, di chuyển, tạo hàng 3 (Mill) bắt quân, bay tự do.

---

## ⚡ TÍNH NĂNG NỔI BẬT:

- **Chế độ chơi đa dạng:**
  * Offline 2 người trên cùng thiết bị (Pass & Play trên PC, Tablet, Điện thoại).
  * Chơi với máy bằng AI Engine riêng biệt (4 cấp độ: Dễ, Trung bình, Khó, Cao thủ).
  * Tạo phòng trực tuyến riêng tư có mật khẩu hoặc công khai.
  * Tự động ghép trận ngẫu nhiên (Matchmaking) theo trình độ Elo tương đương.
  * Khán giả vào xem trực tiếp (Spectator mode).
  * Xem lại ván đấu (Replay Engine) với lịch sử nước đi từng ply.
- **Hệ thống Tài khoản & Elo độc lập:**
  * Elo được tách riêng cho từng môn cờ (ví dụ: Cờ Vua 2200, Cờ Tướng 1800, Caro 2100).
  * Hệ thống Level, XP, chuỗi thắng (streak), huy hiệu danh hiệu.
  * Hỗ trợ chơi nhanh bằng tài khoản Khách (Guest) 1-click.
- **Phòng chơi & Giao tiếp đỉnh cao:**
  * **WebRTC Voice Chat:** Trò chuyện trực tiếp bằng microphone trình duyệt, P2P không độ trễ, có vòng phát sáng nhận diện người đang nói, nút bật/tắt mic và tai nghe.
  * **Chat văn bản realtime:** Tin nhắn nhanh, emoji biểu cảm, thông báo hệ thống.
  * Đồng hồ bấm giờ (Timer Manager) chuẩn Blitz 3+2, 5+0, 10+0, 15+10, Vô hạn.
- **Kiến trúc Pluggable Module:**
  * Dễ dàng thêm môn cờ mới mà không ảnh hưởng đến hệ thống hiện có. Xem chi tiết tại [HOW_TO_ADD_A_GAME.md](file:///d:/Game/HOW_TO_ADD_A_GAME.md).
- **Triển khai miễn phí 100%:**
  * Hướng dẫn chi tiết tại [DEPLOYMENT.md](file:///d:/Game/DEPLOYMENT.md).

---

## 🛠️ HƯỚNG DẪN KHỞI CHẠY DỰ ÁN TRÊN MÁY:

```bash
# 1. Cài đặt dependencies cho cả Server và Client
npm run install:all

# 2. Khởi chạy đồng thời Server và Client ở chế độ Development:
npm run dev

# Hoặc chạy riêng biệt:
# Terminal 1: Chạy Server (Port 4000)
cd server && npm run dev

# Terminal 2: Chạy Client Vite (Port 3000)
cd client && npm run dev
```

Truy cập: `http://localhost:3000` trên trình duyệt để trải nghiệm!
