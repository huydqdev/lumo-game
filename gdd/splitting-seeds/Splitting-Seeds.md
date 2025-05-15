## 1. Tổng Quan Trò Chơi (Game Overview)

* **Tên Trò Chơi:** Splitting Seeds
* **Thể Loại:** Puzzle, casual game.
* **Nền Tảng Mục Tiêu:** Máy tính (điều khiển bằng chuột) và thiết bị di động (điều khiển bằng cảm ứng).
* **Mục Tiêu Người Chơi:** Chia đều số lượng hạt trên mặt đất cho hai chú chim bằng cách xoay một thanh gỗ.

## 2. Lối Chơi (Gameplay)

### 2.1. Mục Tiêu Cốt Lõi
Trong mỗi vòng chơi, người chơi phải xoay một thanh gỗ để chia số hạt hiển thị trên màn hình thành hai phần bằng nhau.

### 2.2. Điều Khiển
* **Máy tính:** Di chuyển chuột để xoay thanh gỗ. Nhấp chuột trái để xác nhận vị trí thanh gỗ.
* **Thiết bị di động:** Chạm và kéo trên màn hình để xoay thanh gỗ. Thả tay để xác nhận vị trí thanh gỗ.

### 2.3. Diễn Biến Vòng Chơi
1.  **Bắt đầu vòng:** Một số lượng hạt nhất định xuất hiện ngẫu nhiên trên khu vực chơi. Thanh gỗ được đặt ở giữa màn hình với một góc xoay ngẫu nhiên ban đầu. (Như trong `Screenshot__20_.png`)
2.  **Tương tác:** Người chơi xoay thanh gỗ. Tâm của thanh gỗ luôn cố định ở giữa màn hình.
3.  **Xác nhận:** Người chơi nhấp chuột hoặc chạm vào màn hình để cố định vị trí thanh gỗ, qua đó chia các hạt thành hai phần. (Như trong `Screenshot__21_.png`)
4.  **Hiển thị kết quả:**
    * Số lượng hạt ở mỗi bên của thanh gỗ được hiển thị. (Như trong `Screenshot__22_.png` cho trường hợp đúng và `Screenshot__23_.png` cho trường hợp sai).
    * **Nếu chia đúng (số hạt hai bên bằng nhau):**
        * Người chơi nhận được điểm.
        * Thanh tiến trình cấp độ tăng lên.
    * **Nếu chia sai (số hạt hai bên không bằng nhau):**
        * Một dấu "X" màu đỏ xuất hiện ở giữa màn hình.
        * Người chơi bị trừ điểm trên thanh tiến trình cấp độ.
5.  Vòng chơi mới bắt đầu.

### 2.4. Kết Thúc Game
Trò chơi có thể kết thúc dựa trên một bộ đếm thời gian (như hiển thị "TIME" trong ảnh chụp màn hình) hoặc sau một số lượng vòng chơi nhất định. Người chơi nhận được điểm thưởng dựa trên cấp độ cuối cùng đạt được.

## 3. Các Yếu Tố Trong Trò Chơi (Game Elements)

### 3.1. Thanh Gỗ (Stick)
* Yếu tố chính người chơi tương tác.
* Luôn nằm ở tâm màn hình và xoay quanh tâm đó.
* Chia màn hình thành hai khu vực để phân chia hạt.

### 3.2. Hạt (Seeds)
* Các đối tượng cần được chia đều.
* Xuất hiện ngẫu nhiên trên màn hình ở mỗi vòng.

### 3.3. Chim (Birds)
* Hai chú chim được đặt ở hai bên màn hình, tượng trưng cho các đối tượng nhận hạt. Chủ yếu mang tính chất trang trí để phù hợp với chủ đề.

### 3.4. Giao Diện Người Dùng (User Interface - UI)
* **Khu vực chơi chính:** Hiển thị thanh gỗ, hạt, và chim.
* **Hiển thị Thời Gian (Time):** Đếm ngược hoặc đếm xuôi (dựa trên ảnh chụp màn hình, có vẻ là đếm ngược hoặc thời gian đã trôi qua của vòng hiện tại).
* **Hiển thị Điểm Số (Score):** Tổng điểm người chơi đạt được.
* **Hiển thị Cấp Độ (Level):** Cấp độ hiện tại của người chơi.
* **Thanh Tiến Trình Cấp Độ (Level Meter):** Hiển thị bằng 4 dấu chấm ở góc trên màn hình. Mỗi khi hoàn thành đúng một vòng, một chấm được tô đầy. Khi cả 4 chấm được tô đầy, người chơi lên cấp và thanh tiến trình được đặt lại.
* **Nút Tạm Dừng (Pause Button - II):** Cho phép người chơi tạm dừng trò chơi. Khi tạm dừng, có thể có tùy chọn "How to Play".
* **Nút Hướng Dẫn (How to Play / ?):**
    * **Trên website:** Nút "How to Play" trước khi bắt đầu trò chơi. Trong game, truy cập qua menu tạm dừng.
    * **Trên ứng dụng di động:** Nút dấu hỏi (?) bên cạnh nút Play trước khi bắt đầu. Trong game, truy cập qua menu tạm dừng.
* **Phản Hồi Kết Quả:**
    * Số lượng hạt ở mỗi bên sau khi chia.
    * Dấu "X" màu đỏ khi chia sai.

## 4. Điểm Số & Cấp Độ (Scoring & Levels)

### 4.1. Tính Điểm
* Điểm được trao dựa trên số vòng hoàn thành đúng, tốc độ trả lời và cấp độ hiện tại.
* Mỗi vòng đúng: $200 \text{ điểm} \times \text{Cấp Độ Hiện Tại}$.
    * Ví dụ: Cấp 1 = 200 điểm, Cấp 5 = 1000 điểm, Cấp 10 = 2000 điểm.

### 4.2. Hệ Thống Cấp Độ
* **Bắt đầu:** Cấp độ 1.
* **Cấp độ tối đa:** Cấp độ 10.
* **Lên cấp:**
    * Hoàn thành đúng 4 vòng liên tiếp để tăng 1 cấp.
    * Thanh tiến trình (4 chấm) hiển thị tiến độ này. Khi đầy, cấp độ tăng và thanh tiến trình được làm mới.
* **Xuống cấp (khi trả lời sai):**
    * Mất một hoặc nhiều chấm trên thanh tiến trình dựa trên mức độ sai lệch của câu trả lời.
    * Số chấm bị mất = $(\text{Chênh lệch số hạt giữa hai bên}) / 2$.
    * Tối đa mất 4 chấm cho một lần trả lời sai.
    * Nếu số chấm bị mất nhiều hơn số chấm hiện có trên thanh tiến trình, người chơi bị tụt 1 cấp và thanh tiến trình được đặt lại.
        * Ví dụ 5/7 (chênh lệch 2): mất $2/2 = 1$ chấm.
        * Ví dụ 2/6 (chênh lệch 4): mất $4/2 = 2$ chấm.
        * Ví dụ 2/10 (chênh lệch 8): mất $8/2 = 4$ chấm.

### 4.3. Điểm Thưởng Kết Thúc Game (End-of-Game Bonus)
* $1000 \text{ điểm} \times \text{Cấp Độ Kết Thúc}$.
* Tối đa 10,000 điểm thưởng (khi kết thúc ở Cấp 10).

## 5. Hình Ảnh & Phong Cách Nghệ Thuật (Visuals & Art Style)

* **Phong cách:** Đồ họa 2D, thân thiện, có phần hoạt hình, màu sắc tươi sáng nhưng không quá chói. (Dựa trên các ảnh chụp màn hình cung cấp)
* **Môi trường:** Nền xanh lá cây với các họa tiết cành cây, lá cây, quả sồi chìm nhẹ, tạo cảm giác ngoài trời, tự nhiên.
* **Đối tượng:**
    * **Chim:** Thiết kế đơn giản, dễ thương.
    * **Hạt:** Hình dạng hạt hướng dương, có viền trắng nổi bật trên nền.
    * **Thanh gỗ:** Thiết kế đơn giản, trực quan.
* **Giao diện người dùng:** Rõ ràng, dễ đọc với phông chữ đơn giản. Các biểu tượng (pause, question mark) trực quan.

## 6. Âm Thanh (Sound - Suy đoán)

* **Nhạc nền:** Nhạc nền nhẹ nhàng, vui tươi, không gây xao nhãng.
* **Hiệu ứng âm thanh (SFX):**
    * Tiếng xoay thanh gỗ.
    * Tiếng "tách" khi xác nhận vị trí.
    * Âm thanh vui vẻ khi chia đúng.
    * Âm thanh "sai" hoặc "X" khi chia không đúng.
    * Âm thanh khi lên cấp.
    * Tiếng lật trang hoặc click khi tương tác với menu.

---