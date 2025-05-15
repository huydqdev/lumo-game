# Tài Liệu Thiết Kế Trò Chơi: Penguin Pursuit

## 1. Tổng Quan Trò Chơi (Game Overview)

* **Tên Trò Chơi:** Penguin Pursuit
* **Thể Loại:** Maze, Puzzle, Arcade
* **Nền Tảng Mục Tiêu:** Máy tính (Yêu cầu bàn phím)
* **Mục Tiêu Người Chơi:** Điều khiển chim cánh cụt của mình vượt qua một mê cung để đến chỗ "bữa trưa ngon lành" (con cá) trước chim cánh cụt đối thủ.
* **Điểm Độc Đáo:** Chế độ xem mê cung và cơ chế điều khiển bị xoay đổi liên tục, thử thách khả năng định hướng và thích ứng của người chơi.

## 2. Lối Chơi (Gameplay)

### 2.1. Mục Tiêu Cốt Lõi
Người chơi phải sử dụng các phím mũi tên trên bàn phím để di chuyển chim cánh cụt của mình qua một mê cung trên tảng băng. Mục tiêu là đến được vị trí con cá trước chim cánh cụt của đối thủ (do AI điều khiển).

### 2.2. Điều Khiển
* Người chơi sử dụng 4 phím mũi tên trên bàn phím: Lên (▲), Xuống (▼), Trái (◄), Phải (►).
* **Cơ Chế Xoay Hướng:**
    * Sau Cấp độ 1, cả bàn chơi (mê cung) và hướng điều khiển sẽ xoay.
    * Một **Mũi Tên Màu Cam** (Orange Arrow) hiển thị trên màn hình (ví dụ: trong một chiếc hộp) luôn tương ứng với phím mũi tên **LÊN (▲)** của bàn phím.
    * Điều này có nghĩa là, phím **LÊN (▲)** sẽ di chuyển chim cánh cụt theo hướng mà Mũi Tên Màu Cam đang chỉ.
    * Người chơi có thể hình dung Mũi Tên Màu Cam luôn chỉ về hướng "Bắc" (North) của mê cung tại thời điểm đó.

### 2.3. Sơ Đồ Điều Khiển Chi Tiết

* **Khi Mũi Tên Màu Cam chỉ LÊN (Hướng Bắc):**
    * ▲: Di chuyển Lên (Bắc)
    * ►: Di chuyển Phải (Đông)
    * ▼: Di chuyển Xuống (Nam)
    * ◄: Di chuyển Trái (Tây)

* **Khi Mũi Tên Màu Cam chỉ XUỐNG (Hướng Nam):**
    * ▲: Di chuyển Xuống (Bắc ảo là Nam thật)
    * ►: Di chuyển Trái (Đông ảo là Tây thật)
    * ▼: Di chuyển Lên (Nam ảo là Bắc thật)
    * ◄: Di chuyển Phải (Tây ảo là Đông thật)

* **Khi Mũi Tên Màu Cam chỉ PHẢI (Hướng Đông):**
    * ▲: Di chuyển Phải (Bắc ảo là Đông thật)
    * ►: Di chuyển Xuống (Đông ảo là Nam thật)
    * ▼: Di chuyển Trái (Nam ảo là Tây thật)
    * ◄: Di chuyển Lên (Tây ảo là Bắc thật)

* **Khi Mũi Tên Màu Cam chỉ TRÁI (Hướng Tây):**
    * ▲: Di chuyển Trái (Bắc ảo là Tây thật)
    * ►: Di chuyển Lên (Đông ảo là Bắc thật)
    * ▼: Di chuyển Phải (Nam ảo là Đông thật)
    * ◄: Di chuyển Xuống (Tây ảo là Nam thật)

### 2.4. Cấu Trúc Phiên Chơi
* Mỗi phiên chơi (session) của Penguin Pursuit bao gồm **8 lượt thử (trials)**.
* Trong mỗi lượt thử, người chơi cạnh tranh với một chim cánh cụt đối thủ để đến chỗ con cá.

## 3. Cấp Độ & Tiến Trình (Levels & Progression)

### 3.1. Bắt Đầu Cấp Độ
* **Lần chơi đầu tiên:** Bắt đầu ở Cấp độ 1.
* **Các lần chơi tiếp theo:** Bắt đầu ở cấp độ thấp hơn 2 bậc so với cấp độ cao nhất đạt được ở cuối phiên chơi trước đó.
    * *Ví dụ:* Nếu kết thúc phiên chơi trước ở Cấp độ 5, phiên chơi tiếp theo sẽ bắt đầu ở Cấp độ 3.

### 3.2. Thay Đổi Cấp Độ Trong Game
* **Tăng Cấp Độ:** Nếu người chơi chiến thắng chim cánh cụt đối thủ trong một lượt thử.
* **Giữ Nguyên Cấp Độ:** Nếu người chơi thua đối thủ NHƯNG ở "gần" con cá khi lượt thử kết thúc.
* **Giảm Cấp Độ:** Nếu người chơi thua đối thủ VÀ ở "xa" con cá khi lượt thử kết thúc.
    * *(Cần định nghĩa rõ ràng "gần" và "xa" là như thế nào, ví dụ: dựa trên số ô hoặc khoảng cách Euclide).*

### 3.3. Cấp Độ Tối Đa
* Cấp độ cao nhất có thể đạt được trong Penguin Pursuit là **40**.

## 4. Tính Điểm (Scoring)

Điểm số được xác định dựa trên tổng khoảng cách di chuyển của chim cánh cụt người chơi và chim cánh cụt đối thủ.

* **Nếu Người Chơi Thắng (đến chỗ cá trước):**
    * Điểm = $(\text{Khoảng cách người chơi đã đi} - \text{Khoảng cách đối thủ đã đi}) \times 2 \times (10 \times \text{Cấp Độ Hiện Tại})$

* **Nếu Người Chơi Thua (đối thủ đến chỗ cá trước):**
    * Điểm = $(\text{Khoảng cách người chơi đã đi} - \text{Khoảng cách đối thủ đã đi}) \times (10 \times \text{Cấp Độ Hiện Tại})$
    * *Lưu ý: Công thức này có thể dẫn đến điểm âm nếu đối thủ di chuyển nhiều hơn người chơi trong khi người chơi thua.*

*(Cần làm rõ "khoảng cách đã đi" được tính như thế nào - ví dụ: số ô di chuyển hợp lệ).*

## 5. Các Yếu Tố Trong Trò Chơi (Game Elements)

* **Chim Cánh Cụt Người Chơi:** Nhân vật chính do người chơi điều khiển.
* **Chim Cánh Cụt Đối Thủ:** Nhân vật do AI điều khiển, cạnh tranh với người chơi.
* **Mê Cung (Tảng Băng):** Môi trường chơi, bao gồm các lối đi và tường băng.
* **Cá (Bữa Trưa):** Mục tiêu của mỗi lượt thử.
* **Mũi Tên Màu Cam:** Chỉ báo trực quan cho hướng "Lên (▲)" hiện tại của cơ chế điều khiển.

## 6. Giao Diện Người Dùng (User Interface - UI) (Dự Kiến)

* **Màn Hình Chính:**
    * Hiển thị mê cung, chim cánh cụt người chơi, chim cánh cụt đối thủ, và con cá.
    * Hiển thị Mũi Tên Màu Cam (hoặc "hộp" chứa mũi tên) để chỉ hướng.
* **Thông Tin Hiển Thị:**
    * Cấp độ hiện tại.
    * Điểm số hiện tại.
    * Số lượt thử hiện tại / Tổng số lượt thử (ví dụ: Trial 3/8).
* **Có thể có:** Nút tạm dừng, hướng dẫn nhanh về điều khiển.

## 7. Hình Ảnh & Âm Thanh (Visuals & Audio) (Chưa có thông tin - cần xác định)

* **Phong Cách Hình Ảnh:** (Ví dụ: 2D top-down, pixel art, hoạt hình dễ thương, v.v.)
* **Âm Nhạc Nền:** (Ví dụ: Giai điệu vui vẻ, phù hợp với chủ đề băng giá)
* **Hiệu Ứng Âm Thanh (SFX):** (Ví dụ: Tiếng bước chân trên băng, tiếng "ting" khi ăn cá, âm thanh khi thắng/thua, tiếng xoay mê cung)

## 8. Các Vấn Đề Cần Làm Rõ Thêm (Open Questions)

* Thiết kế chi tiết của các mê cung ở mỗi cấp độ? Độ khó tăng tiến như thế nào?
* Thuật toán AI cho chim cánh cụt đối thủ?
* Định nghĩa chính xác (ví dụ: số ô) cho "gần" và "xa" con cá để quyết định giữ/giảm cấp độ.
* Cách tính "khoảng cách đã đi" (ví dụ: số ô di chuyển, không tính va chạm tường).
* Cơ chế tạo mê cung (ngẫu nhiên hay thiết kế sẵn)?
* Nếu điểm số có thể âm, có giới hạn dưới cho điểm số không?