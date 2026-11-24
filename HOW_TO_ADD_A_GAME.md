# HƯỚNG DẪN THÊM MỘT LOẠI CỜ MỚI VÀO BOARD ARENA (PLUGGABLE MODULE)

Kiến trúc **Modular Game Engine** của BOARD ARENA cho phép lập trình viên / quản trị viên thêm một môn cờ hoàn toàn mới vào nền tảng mà **KHÔNG CẦN CHỈNH SỬA** bất kỳ dòng code cốt lõi nào của hệ thống phòng, tài khoản, chat, voice chat hay matchmaking.

---

## Cấu trúc module của một môn cờ:
Một môn cờ mới chỉ cần 2 tệp:
1. **Engine Logic & Luật cờ:** `shared/games/MyNewGame.js` (Kế thừa từ `BaseGame`).
2. **Giao diện Bàn cờ:** `client/src/components/boards/MyNewBoard.jsx`.

---

## BƯỚC 1: Tạo Engine luật cờ (`shared/games/MyNewGame.js`)

```javascript
import { BaseGame } from '../gameFramework/BaseGame.js';

export class MyNewGame extends BaseGame {
  constructor() {
    super({
      id: 'my_new_game',
      name: 'My New Game',
      nameVi: 'Cờ Mới Của Bạn',
      category: 'strategy', // 'strategy' | 'traditional' | 'vietnamese' | 'casual'
      description: 'Mô tả ngắn gọn về trò chơi.',
      rulesSummary: 'Tóm tắt luật chơi ngắn gọn.',
      minPlayers: 2,
      maxPlayers: 2,
      icon: 'Gamepad2',
      coverGradient: 'from-purple-800 to-indigo-950',
      defaultSettings: {}
    });
  }

  // 1. Khởi tạo trạng thái bàn cờ ban đầu
  init(options = {}) {
    return {
      board: Array(8).fill(null),
      turn: 0, // 0: Player 1, 1: Player 2
      gameOver: false,
      winner: null
    };
  }

  // 2. Danh sách nước đi hợp lệ của người chơi hiện tại
  getValidMoves(state, playerIndex) {
    if (state.gameOver || state.turn !== playerIndex) return [];
    // Trả về mảng các nước đi hợp lệ
    return [{ action: 'step', target: 0 }];
  }

  // 3. Thực hiện nước đi và trả về state mới
  makeMove(state, move, playerIndex) {
    if (state.turn !== playerIndex) return { nextState: state, valid: false };

    const nextState = this.cloneState(state);
    // Cập nhật bàn cờ
    nextState.turn = 1 - playerIndex;

    // Kiểm tra điều kiện thắng
    if (this._checkWinCondition(nextState)) {
      nextState.gameOver = true;
      nextState.winner = playerIndex;
      return {
        nextState,
        valid: true,
        result: { over: true, winner: playerIndex, reason: 'Người chơi thắng cuộc!' }
      };
    }

    return { nextState, valid: true };
  }

  // 4. Thuật toán AI cho máy (Dễ, Trung bình, Khó, Cao thủ)
  getAIMove(state, playerIndex, difficulty = 'medium') {
    const validMoves = this.getValidMoves(state, playerIndex);
    return validMoves[0];
  }

  // 5. Định dạng nước đi để lưu vào Replay / Notation
  formatMove(move) {
    return JSON.stringify(move);
  }
}
```

---

## BƯỚC 2: Đăng ký Game Engine vào `shared/games/index.js`

Chỉ cần thêm 2 dòng:
```javascript
import { MyNewGame } from './MyNewGame.js';

GameRegistry.register(new MyNewGame());
```
Ngay lập tức:
- Hệ thống Sảnh lobby tự động hiển thị Card game mới.
- Hệ thống Xếp hạng tự động phân bổ cột Elo riêng biệt.
- Hệ thống Tạo phòng & Tìm trận tự động nhận diện gameId mới!

---

## BƯỚC 3: Tạo giao diện Bàn cờ (`client/src/components/boards/MyNewBoard.jsx`)

```jsx
import React from 'react';

export const MyNewBoard = ({ gameState, onMove, isInteractive = true }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Vẽ bàn cờ tương tác (Grid, SVG, hoặc Canvas) */}
      <div className="grid grid-cols-4 gap-2">
        {gameState.board.map((cell, idx) => (
          <div
            key={idx}
            onClick={() => isInteractive && onMove({ target: idx })}
            className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700"
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
};
```

Đăng ký vào `client/src/components/boards/BoardRenderer.jsx`:
```javascript
import { MyNewBoard } from './MyNewBoard';

const BOARDS = {
  // ...các môn cờ hiện có...
  my_new_game: MyNewBoard
};
```

Xong! Game mới của bạn đã sẵn sàng chơi Online, Offline, đấu với AI, lưu Replay và chat voice trực tiếp!
