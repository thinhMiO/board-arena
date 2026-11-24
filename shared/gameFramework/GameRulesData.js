/**
 * Detailed game guides, historical context, piece movements, special mechanics, and strategy tips
 * for all 12 games in BOARD ARENA.
 */
export const GAME_RULES_DATA = {
  chess: {
    id: 'chess',
    title: 'Cờ Vua (Chess)',
    subtitle: 'Môn thể thao trí tuệ đỉnh cao của nhân loại',
    overview: 'Cờ vua là trò chơi chiến thuật 2 người trên bàn cờ 8x8 gồm 64 ô màu sáng tối xen kẽ. Mục tiêu tối thượng là chiếu hết (checkmate) Vua đối phương.',
    setup: 'Mỗi người chơi bắt đầu với 16 quân: 1 Vua, 1 Hậu, 2 Xe, 2 Tượng, 2 Mã và 8 Tốt. Hàng 1 (hoặc 8): Xe - Mã - Tượng - Hậu - Vua - Tượng - Mã - Xe. Hàng 2 (hoặc 7): 8 quân Tốt. Ô góc dưới cùng bên phải của mỗi người luôn là ô màu sáng (h1 hoặc a8). Hậu đứng ở ô trùng màu của mình (Hậu Trắng ô trắng, Hậu Đen ô đen).',
    pieces: [
      { name: 'Vua (King - K)', move: 'Đi 1 ô theo bất kỳ hướng nào (ngang, dọc, chéo). Không được đi vào ô bị đối phương kiểm soát.' },
      { name: 'Hậu (Queen - Q)', move: 'Quân mạnh nhất bàn cờ. Đi số ô tùy ý theo hàng ngang, cột dọc hoặc đường chéo nếu không bị cản.' },
      { name: 'Xe (Rook - R)', move: 'Đi số ô tùy ý theo hàng ngang hoặc cột dọc.' },
      { name: 'Tượng (Bishop - B)', move: 'Đi số ô tùy ý theo các đường chéo. Mỗi bên có 1 Tượng ô sáng và 1 Tượng ô tối.' },
      { name: 'Mã (Knight - N)', move: 'Đi theo hình chữ L (2 ô một hướng rồi 1 ô vuông góc). Mã là quân duy nhất có thể nhảy qua các quân khác.' },
      { name: 'Tốt (Pawn - P)', move: 'Tiến thẳng 1 ô (nước đầu có thể đi 2 ô). Ăn quân theo đường chéo về phía trước 1 ô.' }
    ],
    specialRules: [
      { name: 'Nhập thành (Castling)', desc: 'Nước đi kết hợp duy nhất: Vua di chuyển 2 ô về phía Xe, Xe nhảy qua Vua sang ô bên cạnh. Điều kiện: Vua và Xe chưa từng di chuyển, các ô giữa trống, Vua không bị chiếu và không đi qua ô bị chiếu.' },
      { name: 'Phong cấp (Promotion)', desc: 'Khi Tốt tiến tới hàng cuối cùng của bàn cờ (hàng 8 cho Trắng, hàng 1 cho Đen), Tốt ngay lập tức được phong thành Hậu, Xe, Tượng hoặc Mã theo ý người chơi.' },
      { name: 'Bắt tốt qua đường (En Passant)', desc: 'Nếu Tốt đối phương nhảy 2 ô vượt qua ô mà Tốt của bạn đang kiểm soát, bạn có thể ăn Tốt đó như thể nó chỉ đi 1 ô. Nước này phải thực hiện ngay lượt tiếp theo.' },
      { name: 'Hòa cờ (Stalemate / Pat)', desc: 'Khi người chơi đến lượt đi không bị chiếu nhưng không còn bất kỳ nước đi hợp lệ nào, ván cờ được xử Hòa ngay lập tức.' }
    ],
    tips: [
      'Kiểm soát 4 ô trung tâm (e4, d4, e5, d5) trong giai đoạn khai cuộc.',
      'Phát triển nhanh chóng các quân nhẹ (Mã và Tượng) trước khi di chuyển Hậu.',
      'Nhập thành sớm để bảo vệ an toàn cho Vua và đưa Xe ra tham chiến.'
    ]
  },

  xiangqi: {
    id: 'xiangqi',
    title: 'Cờ Tướng (Xiangqi)',
    subtitle: 'Nghệ thuật quân sự đỉnh cao phương Đông',
    overview: 'Bàn cờ gồm 9 đường dọc và 10 đường ngang, ở giữa có Sông (Sở Hà - Hán Giới) và mỗi bên có Cung Cấm (Cửu cung 3x3). Mục tiêu là bắt hoặc chiếu bí Tướng đối phương.',
    setup: 'Mỗi bên có 16 quân: 1 Tướng, 2 Sĩ, 2 Tượng, 2 Mã, 2 Xe, 2 Pháo, 5 Tốt (Binh). Quân Đỏ đi trước.',
    pieces: [
      { name: 'Tướng (Soái)', move: 'Đi từng ô một theo chiều dọc hoặc ngang, chỉ được di chuyển trong Cung Cấm (3x3). Hai tướng không được nhìn thẳng mặt nhau trên cùng một cột mà không có quân cản (Lộ mặt tướng).' },
      { name: 'Sĩ (Sĩ quan)', move: 'Đi chéo 1 ô mỗi nước, chỉ được hoạt động trong Cung Cấm.' },
      { name: 'Tượng (Voi)', move: 'Đi chéo 2 ô (hình vuông 2x2). Tượng KHÔNG ĐƯỢC qua sông. Nếu có quân ở giữa đường đi (mắt tượng), Tượng sẽ bị cản.' },
      { name: 'Mã (Ngựa)', move: 'Đi chữ nhật (1 bước thẳng, 1 bước chéo). Nếu có quân đứng ngay cạnh bước thẳng (cản chân mã), Mã không thể nhảy theo hướng đó.' },
      { name: 'Xe (Chiến xa)', move: 'Đi ngang hoặc dọc bao nhiêu ô tùy ý nếu không bị cản. Là quân cơ động mạnh nhất.' },
      { name: 'Pháo (Đại bác)', move: 'Di chuyển như Xe. Nhưng khi ăn quân BẮT BUỘC phải nhảy qua đúng một quân khác làm giá/ngòi (bất kể quân mình hay quân địch).' },
      { name: 'Tốt (Binh)', move: 'Trước khi qua sông chỉ tiến thẳng 1 bước. Sau khi qua sông có thể đi thẳng hoặc đi ngang 1 bước. Không bao giờ được đi lùi.' }
    ],
    specialRules: [
      { name: 'Lộ mặt Tướng (Flying General)', desc: 'Hai Tướng tuyệt đối không được đối mặt nhau trực tiếp trên cùng một cột mà không có quân cản giữa. Nước đi nào làm lộ mặt tướng là phạm luật.' },
      { name: 'Cấm chiếu lặp vĩnh viễn (Chiếu dai)', desc: 'Người chơi dùng 1 hoặc nhiều quân chiếu liên tục lặp lại phải đổi nước đi, nếu không sẽ bị xử thua.' }
    ],
    tips: [
      'Xuất nhanh hai Xe để chiếm các lộ trọng yếu (lộ 2, 4, 6, 8).',
      'Phối hợp Pháo giăng (Pháo đầu, Pháo giằng) và Mã quỳ để tạo thế công thủ toàn diện.'
    ]
  },

  go: {
    id: 'go',
    title: 'Cờ Vây (Go / Weiqi / Baduk)',
    subtitle: 'Nghệ thuật bao vây không gian rộng lớn 4000 năm lịch sử',
    overview: 'Chơi trên bàn cờ lưới (9x9 cho người mới, 13x13 nhanh, 19x19 tiêu chuẩn). Hai bên luân phiên đặt quân đen và trắng vào các giao điểm. Bên nào vây được nhiều đất (giao điểm trống) và bắt nhiều tù binh hơn sẽ thắng.',
    setup: 'Bàn cờ ban đầu hoàn toàn trống. Quân Đen luôn đi trước. Để bù lại lợi thế đi trước, Trắng được cộng điểm bù (Komi), thường là 6.5 hoặc 7.5 điểm.',
    pieces: [
      { name: 'Quân Cờ (Stones)', move: 'Đặt vào bất kỳ giao điểm trống nào trên bàn cờ. Khi đã đặt xuống thì không được di chuyển vị trí.' }
    ],
    specialRules: [
      { name: 'Khí (Liberties)', desc: 'Mỗi quân hoặc nhóm quân liên kết có các đường kẻ liền kề dẫn ra giao điểm trống gọi là Khí. Khi một nhóm quân mất hết toàn bộ khí (bị quân đối phương bịt kín), nhóm quân đó bị ăn thịt và nhấc khỏi bàn làm Tù binh.' },
      { name: 'Luật Tự sát (No Suicide)', desc: 'Người chơi không được đặt quân vào ô không còn khí, TRỪ KHI nước đi đó đồng thời ăn hết khí và bắt sống nhóm quân của đối phương.' },
      { name: 'Luật Kiếp (Ko Rule)', desc: 'Không được thực hiện nước đi bắt lại ngay lập tức dẫn đến việc lặp lại trạng thái bàn cờ trước đó. Bạn phải đánh một nước ở vị trí khác (tìm mối đe dọa) trước khi quay lại ăn kiếp.' },
      { name: 'Kết thúc ván đấu', desc: 'Ván cờ kết thúc khi cả 2 người chơi liên tiếp Bỏ lượt (Pass). Đếm đất theo quy tắc: Đất sở hữu + Tù binh bắt được (+ Komi cho Trắng).' }
    ],
    tips: [
      'Ghi nhớ câu châm ngôn: "Góc là vàng, biên là bạc, giữa là cỏ rác" — hãy chiếm góc trước, bành trướng ra biên rồi mới tiến vào trung tâm.',
      'Tạo 2 mắt sống (Two Eyes) cho nhóm quân để đảm bảo nhóm không bao giờ bị bắt.'
    ]
  },

  gomoku: {
    id: 'gomoku',
    title: 'Cờ Caro (Gomoku)',
    subtitle: 'Trò chơi đấu trí phổ biến và hấp dẫn bậc nhất',
    overview: 'Chơi trên bàn cờ caro 15x15 hoặc 19x19. Người chơi luân phiên đánh dấu X và O. Bên nào tạo được 5 quân liên tiếp trước sẽ giành chiến thắng.',
    setup: 'Bàn cờ trống. Bên đi trước thường đánh X (hoặc Đen).',
    pieces: [
      { name: 'Dấu X và O', move: 'Đánh vào bất kỳ ô hoặc giao điểm trống nào trên bàn cờ.' }
    ],
    specialRules: [
      { name: 'Điều kiện thắng', desc: 'Xếp được đúng hoặc từ 5 quân cùng loại thẳng hàng (theo chiều ngang, dọc hoặc đường chéo).' },
      { name: 'Luật chặn 2 đầu (Luật Việt Nam)', desc: 'Nếu tạo được 5 quân liên tiếp nhưng cả 2 đầu đều bị đối phương chặn trước, hàng đó không được tính thắng (phải có ít nhất 1 đầu mở).' },
      { name: 'Luật tự do', desc: 'Bất cứ khi nào tạo được 5 quân thẳng hàng thì thắng ngay, bất kể có bị chặn hay không.' }
    ],
    tips: [
      'Chủ động tạo ra "Nước đôi" (vừa tạo hàng 3 mở, vừa đe dọa hàng 4) để đối phương không thể cản cả hai hướng.',
      'Luôn ưu tiên chặn ngay khi đối phương tạo được hàng 3 mở cả 2 đầu (nước 4 bắt buộc).'
    ]
  },

  checkers: {
    id: 'checkers',
    title: 'Cờ Đam (Checkers / Draughts)',
    subtitle: 'Nghệ thuật nhảy ăn quân và phong Vua kinh điển',
    overview: 'Bàn cờ 8x8 với 64 ô màu sẫm và sáng xen kẽ. Chỉ chơi trên các ô màu sẫm. Mục tiêu là bắt hết quân hoặc làm đối phương không còn nước đi hợp lệ.',
    setup: 'Mỗi bên có 12 quân đặt trên 3 hàng đầu của mình (chỉ trên các ô màu sẫm).',
    pieces: [
      { name: 'Quân Thường', move: 'Đi chéo tiến lên phía trước 1 ô vào ô trống. Không được đi lùi.' },
      { name: 'Vua (King)', move: 'Khi quân thường tiến đến hàng cuối cùng của đối phương, quân đó được phong Vua (đội vương miện). Vua có thể đi và ăn quân theo cả hướng tiến lẫn lùi!' }
    ],
    specialRules: [
      { name: 'Nhảy ăn quân', desc: 'Nếu một quân đối phương đứng ở ô chéo liền kề và ô ngay sau nó trống, bạn bắt buộc phải nhảy qua quân đó vào ô trống và nhấc quân đối phương ra khỏi bàn.' },
      { name: 'Ăn quân liên hoàn', desc: 'Sau khi nhảy ăn 1 quân, nếu vị trí mới tiếp tục có thể nhảy ăn quân khác, người chơi BẮT BUỘC phải tiếp tục nhảy ăn liên tiếp trong cùng 1 lượt.' }
    ],
    tips: [
      'Giữ hàng quân cuối cùng của mình càng lâu càng tốt để ngăn đối phương phong Vua.',
      'Kiểm soát trung tâm bàn cờ để tạo thế gọng kìm ép đối phương vào thế bị bắt quân.'
    ]
  },

  reversi: {
    id: 'reversi',
    title: 'Cờ Lật (Othello / Reversi)',
    subtitle: 'Một phút để học, một đời để thành thạo',
    overview: 'Bàn cờ 8x8. Sử dụng 64 đĩa cờ hai mặt (một mặt Đen, một mặt Trắng). Mục tiêu là kết thúc ván đấu với số đĩa mang màu của mình nhiều hơn đối thủ.',
    setup: 'Khởi đầu với 4 đĩa cờ ở 4 ô trung tâm (2 Đen, 2 Trắng xếp chéo nhau). Đen luôn đi trước.',
    pieces: [
      { name: 'Đĩa Cờ Hai Mặt', move: 'Đặt vào ô trống sao cho kẹp ít nhất một đĩa của đối phương giữa đĩa mới đặt và một đĩa sẵn có của mình theo đường ngang, dọc hoặc chéo.' }
    ],
    specialRules: [
      { name: 'Lật cờ', desc: 'Tất cả các đĩa của đối thủ nằm giữa đĩa mới đặt và đĩa của bạn trên các đường thẳng bị kẹp sẽ bị lật sang màu của bạn!' },
      { name: 'Bắt buộc phải lật cờ', desc: 'Người chơi chỉ được đặt đĩa vào ô có thể lật được ít nhất 1 đĩa đối phương. Nếu không có nước đi nào lật được cờ, bạn bắt buộc phải Bỏ lượt (Pass).' },
      { name: 'Kết thúc ván đấu', desc: 'Khi cả 64 ô đã kín hoặc cả hai người chơi đều không còn nước đi hợp lệ, ai có số đĩa nhiều hơn trên bàn cờ sẽ chiến thắng.' }
    ],
    tips: [
      'Bốn góc bàn cờ (a1, a8, h1, h8) là những ô bất khả xâm phạm (không bao giờ bị lật lại). Ai chiếm được góc sẽ nắm giữ lợi thế cực lớn!',
      'Giai đoạn đầu ván, đừng vội lật quá nhiều đĩa. Hãy giữ số đĩa ít để hạn chế nước đi của đối thủ.'
    ]
  },

  connect_four: {
    id: 'connect_four',
    title: 'Cờ 4 (Connect Four)',
    subtitle: 'Thả thẻ trọng lực 4 quân thẳng hàng',
    overview: 'Khung lưới đứng gồm 7 cột x 6 hàng. Hai người chơi lần lượt thả các thẻ cờ màu Đỏ và Vàng vào các cột. Thẻ cờ sẽ rơi xuống vị trí trống thấp nhất của cột đó.',
    setup: 'Khung cờ ban đầu hoàn toàn trống rỗng.',
    pieces: [
      { name: 'Thẻ Cờ (Tokens)', move: 'Chọn 1 trong 7 cột còn chỗ trống để thả thẻ cờ rơi xuống.' }
    ],
    specialRules: [
      { name: 'Điều kiện thắng', desc: 'Người đầu tiên xếp được 4 thẻ cùng màu thẳng hàng (theo chiều ngang, dọc hoặc chéo) sẽ thắng ngay lập tức.' },
      { name: 'Hòa cờ', desc: 'Nếu cả 42 ô đều đầy mà chưa ai có hàng 4 thì ván cờ hòa.' }
    ],
    tips: [
      'Cột trung tâm (Cột 4) là cột quan trọng nhất vì nó tham gia vào hầu hết các đường chéo và hàng ngang có thể tạo thành 4 quân.',
      'Luôn chú ý kiểm tra các mối đe dọa đôi của đối thủ để chặn kịp thời.'
    ]
  },

  shogi: {
    id: 'shogi',
    title: 'Cờ Tướng Nhật Bản (Shogi)',
    subtitle: 'Chiến thuật tái sử dụng quân cờ độc nhất vô nhị',
    overview: 'Bàn cờ 9x9 với các quân cờ hình nêm ngũ giác. Đặc điểm độc đáo nhất của Shogi: quân cờ bắt được của đối phương không bị loại bỏ mà được giữ trên tay và có thể thả lại vào bàn cờ thành quân của mình!',
    setup: 'Mỗi bên có 20 quân: 1 Vua (Gyoku/Ou), 1 Xe (Hisha), 1 Tượng (Kaku), 2 Tướng Vàng (Kin), 2 Tướng Bạc (Gin), 2 Mã (Keima), 2 Hương xa (Kyosha) và 9 Tốt (Fuhyo).',
    pieces: [
      { name: 'Vua (King)', move: 'Đi 1 ô theo bất kỳ hướng nào (ngang, dọc, chéo).' },
      { name: 'Xe (Rook)', move: 'Đi ngang, dọc tùy ý. Khi phong cấp thành Long Vương (Promoted Rook) được thêm đi chéo 1 ô.' },
      { name: 'Tượng (Bishop)', move: 'Đi chéo tùy ý. Khi phong cấp thành Long Mã (Promoted Bishop) được thêm đi ngang dọc 1 ô.' },
      { name: 'Tướng Vàng (Gold)', move: 'Đi 1 ô theo 4 hướng trực giao và 2 hướng chéo tiến về phía trước.' },
      { name: 'Tướng Bạc (Silver)', move: 'Đi 1 ô tiến thẳng hoặc 4 hướng chéo. Phong cấp thành quân có cách đi giống Tướng Vàng.' },
      { name: 'Mã (Knight)', move: 'Nhảy 2 ô về phía trước rồi 1 ô sang trái hoặc phải. Có thể nhảy qua quân khác.' },
      { name: 'Hương xa (Lance)', move: 'Chỉ đi thẳng về phía trước bao nhiêu ô tùy ý (như xe chỉ tiến).' },
      { name: 'Tốt (Pawn)', move: 'Tiến thẳng 1 ô và ăn thẳng 1 ô.' }
    ],
    specialRules: [
      { name: 'Thả quân (Drop)', desc: 'Thay vì đi một quân trên bàn, bạn có thể thả bất kỳ quân nào đang giữ trên tay vào một ô trống bất kỳ trên bàn cờ dưới dạng chưa phong cấp.' },
      { name: 'Khu vực Phong cấp', desc: 'Ba hàng cuối của đối phương là vùng phong cấp. Quân cờ khi tiến vào, di chuyển bên trong hoặc đi ra khỏi vùng này đều có quyền phong cấp.' },
      { name: 'Luật cấm thả Tốt (Nifu & Uchifuzume)', desc: 'Không được thả Tốt vào cột đã có sẵn một Tốt chưa phong cấp của mình. Không được thả Tốt để chiếu hết Vua đối phương ngay lập tức.' }
    ],
    tips: [
      'Bảo vệ Vua bằng cấu trúc phòng thủ kinh điển của Shogi như Thành Yagura hoặc Lâu đài Mino.',
      'Sử dụng các quân bắt được để thả vào các vị trí hiểm hóc sau lưng đối thủ.'
    ]
  },

  co_ganh: {
    id: 'co_ganh',
    title: 'Cờ Gánh (Vietnamese Traditional Folk Game)',
    subtitle: 'Nét đẹp cờ dân gian truyền thống Việt Nam',
    overview: 'Chơi trên bàn cờ 5x5 có các đường kẻ ngang dọc và đường chéo tạo thành các hình thoi lồng nhau. Mỗi bên có 8 quân (Xanh và Đỏ). Mục tiêu là ăn hết toàn bộ quân đối phương.',
    setup: 'Mỗi bên có 8 quân. Phe Xanh xếp ở hàng dưới (hàng 4 có 5 quân, hàng 3 có quân ở ô 0, 2, 4). Phe Đỏ xếp đối xứng ở phía trên.',
    pieces: [
      { name: 'Quân Cờ Gánh', move: 'Đi từng bước một dọc theo các đường nối có sẵn (ngang, dọc hoặc đường chéo nếu có).' }
    ],
    specialRules: [
      { name: 'Nước đi "Gánh"', desc: 'Khi người chơi di chuyển 1 quân của mình vào vị trí nằm CHÍNH GIỮA 2 quân của đối phương trên một đường thẳng, cả 2 quân đối phương đó sẽ bị "Gánh" và ngay lập tức đổi màu biến thành quân của bạn!' },
      { name: 'Nước đi "Vây" (Chẹt)', desc: 'Khi một nhóm quân của đối phương bị quân bạn bao vây chặt chẽ và không còn bất kỳ đường di chuyển hợp lệ nào, toàn bộ nhóm quân đó bị "Vây" và đổi màu thành quân của bạn!' },
      { name: 'Chiến thắng', desc: 'Bên nào biến đổi toàn bộ quân đối phương hoặc làm đối phương không còn nước đi sẽ thắng cuộc.' }
    ],
    tips: [
      'Chiếm giữ ô trung tâm (ô 2,2) vì đây là giao điểm của nhiều đường chéo và đường thẳng nhất, dễ dàng tạo thế Gánh kép.',
      'Chú ý bẫy "Mở đường gánh": cố tình để đối phương gánh quân mình nhằm mở ra thế gánh ngược lại lớn hơn.'
    ]
  },

  o_an_quan: {
    id: 'o_an_quan',
    title: 'Cờ Ô Ăn Quan (Vietnamese Mancala)',
    subtitle: 'Trò chơi rải quân dân gian đậm đà ký ức tuổi thơ',
    overview: 'Bàn cờ hình chữ nhật gồm 10 ô vuông nhỏ (ô Dân, mỗi bên 5 ô) và 2 ô hình bán nguyệt ở 2 đầu (ô Quan). Ban đầu mỗi ô Dân có 5 viên sỏi (dân), mỗi ô Quan có 1 viên đá lớn (hoặc 10 viên sỏi tượng trưng cho Quan).',
    setup: 'Hai người chơi ngồi đối diện nhau. Mỗi người kiểm soát 5 ô dân ở phía trước mặt mình. Tổng cộng 50 dân và 2 quan.',
    pieces: [
      { name: 'Quân Dân & Quân Quan', move: 'Dân trị giá 1 điểm mỗi viên. Quan trị giá 10 điểm mỗi viên.' }
    ],
    specialRules: [
      { name: 'Cách rải quân', desc: 'Người chơi bốc toàn bộ quân ở 1 trong 5 ô dân của mình, sau đó rải lần lượt từng viên vào các ô liền kề theo chiều thuận hoặc ngược chiều kim đồng hồ.' },
      { name: 'Nối tiếp', desc: 'Nếu viên sỏi cuối cùng rơi vào một ô Dân có chứa quân, người chơi bốc tiếp toàn bộ số quân ở ô đó và tiếp tục rải theo chiều đã chọn.' },
      { name: 'Ăn quân', desc: 'Nếu viên sỏi cuối cùng rơi vào một ô dân, và ô LIỀN KỀ TIẾP THEO là Ô TRỐNG, và ô SAU Ô TRỐNG ĐÓ CÓ QUÂN: người chơi được "Ăn" toàn bộ số quân ở ô đó! Nếu sau ô vừa ăn lại có ô trống và ô có quân, người chơi được "Ăn liên hoàn".' },
      { name: 'Dừng lại ở Quan', desc: 'Nếu viên sỏi cuối cùng rơi vào ô trước ô Quan, hoặc ô Quan có chứa sỏi thì lượt đi dừng lại.' },
      { name: 'Cháy quân (Rải quân bắt buộc)', desc: 'Nếu đến lượt đi mà cả 5 ô dân của người chơi đều trống rỗng, người chơi phải lấy 5 viên sỏi từ số điểm đã ăn của mình để rải vào 5 ô (mỗi ô 1 viên) rồi mới chọn ô để đi.' },
      { name: 'Kết thúc ván đấu', desc: 'Ván cờ kết thúc khi cả 2 ô Quan đều bị ăn hết. Số quân còn lại ở 5 ô bên nào thuộc về người chơi bên đó. Ai nhiều điểm hơn sẽ thắng.' }
    ],
    tips: [
      'Tính toán nước đi sao cho viên sỏi cuối cùng tạo ra thế "cách một ô trống" để ăn được các ô dân có số lượng sỏi lớn.',
      'Ưu tiên ăn ô Quan càng sớm càng tốt vì mỗi Quan tương đương 10 điểm lớn.'
    ]
  },

  co_ca_ngua: {
    id: 'co_ca_ngua',
    title: 'Cờ Cá Ngựa (Ludo / Horse Race)',
    subtitle: 'Trò chơi đua ngựa rộn rã tiếng cười',
    overview: 'Bàn cờ chữ thập gồm 4 góc chuồng ngựa với 4 màu (Đỏ, Xanh Dương, Vàng, Xanh Lá). Mục tiêu là đưa cả 4 chú ngựa của mình chạy hết 1 vòng quanh bàn cờ và tiến vào các bậc chuồng đích 1, 2, 3, 4, 5, 6.',
    setup: 'Mỗi người chơi có 4 chú ngựa nằm trong chuồng xuất phát. Lần lượt gieo xúc xắc (1-6 chấm).',
    pieces: [
      { name: 'Ngựa Đua (Horses)', move: 'Gieo xúc xắc được 1 hoặc 6 để xuất quân ra ô xuất phát. Khi đã ra đường đua, ngựa di chuyển theo số chấm xúc xắc theo chiều kim đồng hồ.' }
    ],
    specialRules: [
      { name: 'Xuất quân', desc: 'Gieo được 1 hoặc 6 để xuất quân từ chuồng ra cửa xuất phát. Nếu cửa xuất phát đang có ngựa đối phương thì được đá văng ngựa đó về chuồng!' },
      { name: 'Luật cản đường', desc: 'Ngựa di chuyển theo số chấm xúc xắc và TUYỆT ĐỐI KHÔNG ĐƯỢC NHẢY QUA bất kỳ quân cờ nào (quân mình hay đối thủ) nằm trên các ô ở giữa quãng đường đi. Nếu bị cản thì không thể thực hiện nước đi đó.' },
      { name: 'Đá ngựa đối phương', desc: 'Khi ngựa di chuyển không bị cản và đáp đúng vào ô đang có ngựa của đối phương đứng, ngựa của đối phương sẽ bị "ĐÁ" văng về chuồng xuất phát!' },
      { name: 'Thêm lượt khi gieo 6', desc: 'Gieo được mặt 6 xúc xắc sẽ được quyền gieo thêm một lượt nữa sau khi di chuyển.' },
      { name: 'Lên chuồng đích', desc: 'Khi ngựa chạy đủ 1 vòng về tới cửa chuồng đích, ngựa tiến vào các bậc chuồng từ 1 đến 6. Có thể tiến theo số bước hoặc nhảy lên đúng bậc tương ứng với mặt xúc xắc nếu không bị ngựa mình cản.' }
    ],
    tips: [
      'Ưu tiên xuất quân càng nhiều ngựa ra đường đua càng tốt để tăng tính linh hoạt khi gieo được các con số khác nhau.',
      'Tận dụng cơ hội đá ngựa đối phương đang tiến gần cửa chuồng để cản bước họ về đích.'
    ]
  },

  nine_mens_morris: {
    id: 'nine_mens_morris',
    title: "Cờ Chín Quân (Nine Men's Morris)",
    subtitle: 'Di sản chiến thuật thời La Mã cổ đại',
    overview: 'Bàn cờ gồm 3 hình vuông đồng tâm được nối với nhau qua 4 đường trung điểm, tạo thành 24 giao điểm. Mỗi người chơi có 9 quân cờ.',
    setup: 'Bàn cờ ban đầu trống. Trò chơi diễn ra qua 3 giai đoạn rõ rệt.',
    pieces: [
      { name: '9 Quân Cờ', move: 'Giai đoạn 1: Lần lượt đặt quân vào điểm trống. Giai đoạn 2: Đi quân sang điểm trống liền kề. Giai đoạn 3 (khi chỉ còn 3 quân): Bay tự do đến bất kỳ điểm trống nào.' }
    ],
    specialRules: [
      { name: 'Tạo hàng 3 (Mill)', desc: 'Bất cứ khi nào người chơi xếp được 3 quân thẳng hàng dọc theo một đường nối của bàn cờ, họ tạo thành một "Mill" và được quyền BẮT 1 quân cờ bất kỳ của đối phương nhấc khỏi bàn.' },
      { name: 'Bảo vệ quân trong Mill', desc: 'Không được bắt quân của đối phương nếu quân đó đang nằm trong một hàng 3 (Mill), trừ khi tất cả quân đối thủ đều đang nằm trong các Mill.' },
      { name: 'Bay tự do (Flying Phase)', desc: 'Khi người chơi bị bắt chỉ còn đúng 3 quân cờ, các quân của họ được phép "Bay" (nhảy thẳng đến bất kỳ điểm trống nào trên bàn cờ).' },
      { name: 'Điều kiện thắng', desc: 'Đối thủ bị bắt chỉ còn 2 quân cờ (không thể tạo Mill được nữa) hoặc đối thủ bị chặn hoàn toàn không còn nước đi hợp lệ.' }
    ],
    tips: [
      'Cố gắng tạo ra thế "Hàng 3 đôi" (Double Mill): mỗi lượt di chuyển 1 quân ra khỏi hàng 3 này sẽ lập tức tạo thành hàng 3 khác, giúp bạn liên tục bắt quân đối phương mỗi lượt!'
    ]
  }
};
