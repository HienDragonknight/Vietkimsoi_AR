# TÀI LIỆU GIỚI THIỆU VÀ TRIỂN KHAI LUỒNG LOGIC DỰ ÁN DEMO AR

Tài liệu này cung cấp cái nhìn toàn diện về mặt kỹ thuật, kiến trúc thư mục, luồng hoạt động của hệ thống, và các xử lý logic thông minh trong dự án **Next.js 15+ Augmented Reality (AR) Image Tracking**.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

Dự án được xây dựng dựa trên các tiêu chuẩn phát triển frontend hiện đại, tối ưu hiệu năng và mang lại trải nghiệm người dùng cao cấp (Apple-like UX/UI):

*   **Next.js 15+ (App Router):** Framework React mạnh mẽ nhất hiện nay, sử dụng cấu trúc App Router hỗ trợ Server Components tối ưu hóa SEO và Client Components linh hoạt cho tương tác camera trực tiếp.
*   **TypeScript:** Đảm bảo an toàn kiểu dữ liệu (Type-Safety) tuyệt đối cho toàn bộ ứng dụng, tránh các lỗi runtime khi thao tác với luồng MediaStream và thư viện bên thứ ba.
*   **Tailwind CSS:** Thiết kế giao diện hiệu năng cao, ứng dụng phong cách **Glassmorphism** (kính mờ), tối ưu hóa lớp phủ bóng (smooth shadows), bo góc mềm mại và hỗ trợ đầy đủ thiết kế thích ứng (Responsive) kèm vùng an toàn cho thiết bị di động (`env(safe-area-inset-*)`).
*   **Framer Motion:** Thư viện diễn hoạt (animation) hàng đầu cho React, giúp chuyển cảnh m mượt mà, tạo nhịp thở nhẹ ("breathing") cho hồng tâm quét và tia laser quét động.
*   **Lucide React:** Bộ thư viện icon vector sắc nét, tối giản, đồng bộ với phong cách giao diện tối giản, hiện đại.
*   **MindAR.js (v1.2.5 - Image Tracking Core):** Thư viện nhận diện thực tế ảo tăng cường siêu nhẹ chạy trực tiếp trên trình duyệt bằng nhân đồ họa **WebGL thông qua công nghệ TensorFlow.js WebGL backend** để xử lý song song trên GPU của thiết bị di động mà không cần máy chủ trung gian.

---

## 2. Kiến Trúc Thư Mục (Project Architecture)

Dự án tuân thủ nghiêm ngặt mô hình thiết kế mô-đun gọn gàng, dễ bảo trì và mở rộng:

```
project/
├── public/
│   └── assets/
│       ├── targets.mind          # Tệp nén chứa các điểm đặc trưng của các ảnh Marker
│       ├── marker1.jpg           # Ảnh Marker gốc dùng để đối chiếu thiết kế
│       └── videos/
│           └── 1.mp4             # Video AR chất lượng cao phát khi quét thành công
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Cấu hình thẻ html/body, nạp phông chữ và viewport fit=cover
│   │   ├── globals.css           # Cấu hình Tailwind CSS, phong cách nền tối và biến môi trường safe-area
│   │   ├── page.tsx              # Trang 1: Quét ảnh camera tự động (Auto-Scan)
│   │   └── ar-video/
│   │       └── [id]/
│   │           ├── page.tsx      # Nhận id từ URL động và kết xuất phía máy chủ (SSR metadata)
│   │           └── ArVideoView.tsx # Trang 2: Hiển thị video kết quả AR toàn màn hình
│   ├── components/
│   │   ├── CameraView.tsx        # Trình bao camera, tự động phát hiện camera trước/sau để lật hình (mirror)
│   │   ├── ScanOverlay.tsx       # Hồng tâm quét laser động, tự động đổi màu theo trạng thái quét
│   │   ├── ScanButton.tsx        # Thanh trạng thái kính mờ động hiển thị tiến trình quét tự động
│   │   ├── CloseButton.tsx       # Nút đóng tròn kính mờ góc trên bên phải
│   │   ├── VideoPlayer.tsx       # Khung phát video tỷ lệ chuẩn, tự động lặp, bo tròn góc cao cấp
│   │   ├── BackButton.tsx        # Nút "Quay lại" dạng viên thuốc màu trắng nổi mượt mà
│   │   ├── LoadingScreen.tsx     # Màn hình chờ chuyển cảnh cao cấp với hiệu ứng vòng tròn đồng tâm
│   │   └── StatusToast.tsx       # Toast thông báo thả nổi phía trên màn hình (báo lỗi/báo quét)
│   ├── hooks/
│   │   ├── useCamera.ts          # Quản lý vòng đời MediaStream, yêu cầu camera sau và phát hiện hướng camera
│   │   └── useMindAR.ts          # Nạp động MindAR SDK từ CDN, khởi tạo controller WebGL và xử lý quét dưới nền
│   ├── config/
│   │   └── index.ts              # Bản đồ ánh xạ từ Marker Index sang Video ID và các thông số bộ lọc nhiễu AR
│   └── types/
│       └── index.ts              # Định nghĩa cấu trúc kiểu dữ liệu TypeScript cho toàn hệ thống
```

---

## 3. Luồng Hoạt Động Của Hệ Thống (System Flow)

Luồng đi của người dùng được thiết kế khép kín, tự động hóa hoàn toàn nhằm mang lại trải nghiệm tiện lợi tối đa:

```
[Mở Trang Chủ /]
       │
       ▼
[useCamera: Yêu cầu Camera Sau] ──(Lỗi: Từ chối/Không có)──► [Hiện giao diện Lỗi + Nút Thử Lại]
       │
       ▼ (Thành công)
[CameraView: Phát luồng video]
       │
       ▼ (Tự động kích hoạt)
[useMindAR: Nạp MindAR.js SDK & Tải targets.mind]
       │
       ▼
[Khởi chạy dummyRun làm ấm GPU (WebGL)]
       │
       ▼
[Bắt đầu quét tự động dưới nền (Auto-Scan Active)] 
 ├── Quét Sai Ảnh / Lệch Mục Tiêu quá 6s ──────► [Đổi viền ScanOverlay sang Đỏ rực & Hiện Toast báo lỗi]
 └── Nhận diện trúng điểm đặc trưng (Marker 1) ──► [Đổi viền ScanOverlay sang Xanh lục & Chuyển trang tức thì]
                                                                     │
                                                                     ▼
                                                       [Mở Trang Kết Quả /ar-video/1]
                                                                     │
                                                                     ▼
                                                       [Tự động phát Video AR vòng lặp]
```

---

## 4. Giải Thích Chi Tiết Logic Code Cốt Lõi

### A. Tự động hóa camera sau & Quản lý hướng camera (`useCamera.ts`)
Thiết bị di động có nhiều camera (trước/sau). Để quét AR, bắt buộc phải dùng **camera sau** (`facingMode: "environment"`) để người dùng hướng lưng điện thoại vào bức ảnh.
*   **Logic:** Yêu cầu luồng hình ảnh độ phân giải cao `1920x1080` lý tưởng với bộ lọc `facingMode: { ideal: "environment" }`.
*   **Xử lý lật hình thông minh (Anti-Mirror):**
    *   Nếu người dùng chạy trên Laptop hoặc thiết bị chỉ có camera trước (Webcam), hệ thống tự phát hiện hướng camera là `"user"` và áp dụng CSS `transform: scaleX(-1)` để hiển thị dạng soi gương (thuận mắt).
    *   Nếu camera hoạt động là camera sau (`"environment"`), hệ thống giữ nguyên luồng hình ảnh gốc **không lật gương**, giúp chữ viết và hình ảnh trên marker không bị đảo ngược, giúp MindAR nhận diện chính xác 100%.

### B. Tối ưu hóa tải thư viện động và xử lý tài nguyên (`useMindAR.ts`)
Để tránh làm nặng gói build ban đầu của Next.js (do MindAR chứa các nhân tính toán TensorFlow.js lớn), thư viện MindAR được nạp dưới dạng **Lazy-Loading** (tải động từ CDN của jsDelivr) chỉ khi ứng dụng được mở trên trình duyệt của máy khách.
*   **Tránh rò rỉ bộ nhớ (Memory Leak Prevention):** Khi người dùng chuyển trang hoặc nhấn quay lại, hook tự động gọi phương thức `controller.stopProcessVideo()` và `controller.dispose()` để giải phóng GPU và tắt luồng phân tích hình ảnh, tránh nóng máy và hao pin.
*   **Tinh chỉnh bộ lọc chống rung (OneEuroFilter):** Cấu hình `filterMinCF: 0.001` và `filterBeta: 1000` được hiệu chuẩn giúp giảm thiểu tối đa hiện tượng rung lắc của khung hình AR khi người dùng cầm điện thoại không chắc tay.

### C. Quét tự động (Auto-Scan) & Nhận diện sai ảnh thông minh (Smart Mismatch)
Đây là cải tiến đột phá giúp nâng tầm trải nghiệm người dùng:
1.  **Auto-Scan:** Ngay khi camera tải xong, hiệu ứng nhịp thở nhẹ của khung quét bật lên, hệ thống tự động chạy quét mà người dùng không cần bấm bất cứ nút nào.
2.  **Logic phát hiện sai ảnh:**
    *   Một bộ đếm thời gian `setTimeout` 6 giây được thiết lập khi trạng thái quét bắt đầu.
    *   Nếu người dùng hướng camera vào một vật thể không khớp với điểm đặc trưng trong tệp `targets.mind` sau 6 giây, hệ thống sẽ xác nhận ảnh đang quét là **sai ảnh**.
    *   Trạng thái chuyển sang `isMismatched = true`: Hồng tâm và vệt laser quét chuyển sang **màu đỏ rose rực rỡ (`rose-500`)**, Toast thông báo đỏ nổi lên yêu cầu người dùng căn chỉnh lại đúng ảnh Marker 1.
3.  **Điều hướng tức thời (Instant Routing):** Ngay khi người dùng đưa đúng ảnh `marker1.jpg` vào tầm ngắm, MindAR lập tức khớp điểm đặc trưng thành công. Khung quét chuyển sang **màu xanh lục ngọc bảo (`emerald-500`)** cực đẹp và chuyển hướng trang tức thì đến URL phát video mà không có bất kỳ độ trễ nào.

---

## 5. Các Điểm Sáng Về Mặt Trải Nghiệm Người Dùng (UX/UI Highlights)

*   **Thiết kế Apple-like Glassmorphism:** Các lớp phủ nền, nút đóng, và thanh trạng thái được bo góc tròn lớn (`rounded-full`), viền mờ màu trắng sữa nửa trong suốt pha trộn hiệu ứng làm mờ hậu cảnh (`backdrop-blur-md` và `backdrop-blur-xl`) mang lại cảm giác cực kỳ sang trọng và có chiều sâu không gian.
*   **Tương tác chuyển động mượt mà (Fluid Micro-interactions):** Nút đóng tròn, nút quay lại hay video đều có hiệu ứng tăng/giảm tỷ lệ (`scale`) nhẹ nhàng khi nhấn hoặc di chuột qua bằng Framer Motion.
*   **Tương thích tối đa với thiết bị di động:** Giao diện được bù đắp các khoảng trống an toàn chống bị che khuất bởi cụm "tai thỏ", "Dynamic Island" hoặc thanh điều hướng dưới đáy màn hình của các dòng máy iPhone/Android đời mới.
*   **Tự động lặp lại thông minh:** Khi phát video kết quả thành công, video được đặt chế độ tự lặp lại vô hạn, có khung scan 4 góc bán trong suốt bao bọc xung quanh, tạo cảm giác như video đang được chiếu trực tiếp nổi lên trên tấm ảnh gốc.

---

*Tài liệu được soạn thảo cho mục đích phát triển sản phẩm chuẩn chất lượng sản xuất (Production-Quality) của Frontend Team.*
