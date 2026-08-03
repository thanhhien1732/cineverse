# UI Gap Analysis — Legacy vs Next.js

## Phạm vi và giới hạn xác minh

Đã so sánh 12 entry HTML, các entry JS theo trang, `frontend/css/styles.css` (selector và breakpoint), với routes/components hiện có ở `frontend-next`. Đây là audit source-level; chưa có screenshot diff desktop/tablet/mobile nên không thể xác nhận pixel-perfect.

## Token nền tảng

- Khớp: background `#05070d`, surface `#0c111d`, primary `#6f7cff`, bright `#8bd5ff`, border alpha, radius 18px, max width 1360px.
- Lệch: legacy định nghĩa header 78px và breakpoints 1120/920/720/680/640/520/430/380px; frontend mới mới áp dụng một phần qua utilities mặc định.
- Lệch: legacy dùng section-specific typography/spacing, overlay và hover transitions; Next.js hiện không có map class 1:1 cho toàn bộ selector.

## Theo trang

| Legacy | Route | Chênh lệch còn lại |
|---|---|---|
| `index.html` | `/` | Thiếu hero switcher tabs/arrows, experience strip, featured video/promo strip và feedback newsletter. |
| `movies.html` | `/movies` | Filter status dùng select thay vì tab/hash state; card hover/overlay chưa map 1:1. |
| `movie-detail.html` | `/movies/[id]` | Đã có trailer/related; layout metadata/showtime panel vẫn không cùng DOM/CSS legacy. |
| `showtimes.html` | `/showtimes` | Data flow có nhưng thiếu age restriction modal, booking panel head/summary sidebar exact styles. |
| `seats.html` | `/booking/[showtimeId]/seats` | Thiếu seat hold timer, legacy aisle/seat geometry và selected pulse/legend styling. |
| `combos.html` | `/booking/combos` | Có 4 fixture; combo card/image/selected state/footer khác legacy. |
| `checkout.html` | `/booking/checkout` | Thiếu rewards/points/card validation/MoMo dialog/checkout toast legacy. |
| `ticket.html`, `tickets.html` | `/ticket/[id]`, `/tickets` | QR visual và print state chưa cùng ticket DOM/print CSS legacy. |
| `auth.html` | `/auth` | Thiếu auth hero, security note, benefit pane và profile/avatar form hoàn chỉnh. |
| `admin.html` | `/admin` | Staff auth mock có nhưng visual staff login card/initial-admin states chưa exact. |
| `verify.html` | `/verify` | Gate shell và jsQR flow có; scanner/result DOM, secure-context/status states chưa exact. |

## Shared interaction gaps

- Chưa có shared Toast provider hoặc shared modal API tương đương `core.js`.
- Header thiếu legacy scroll class animation/account avatar state detail; mobile drawer có nhưng không cùng DOM/transition.
- Focus/hover/disabled chỉ được áp dụng từ shadcn base ở nhiều component; chưa có chứng cứ state matrix 1:1.

## Điều kiện để ký nhận Pixel-Perfect

1. Chuyển từng selector/layout state legacy vào component map rõ ràng, không chỉ token.
2. Chạy screenshot diff ở 1440, 1120, 920, 720, 680, 640, 520, 430 và 380px.
3. Test interaction camera/QR bằng camera thật hoặc media mock; test seat timer, modal, toast, checkout validation và print.

## Kết luận

Frontend hiện build được và đã có nhiều flow mock, nhưng **chưa đạt mức 100% pixel-perfect parity**. Các mục trên là backlog bắt buộc trước khi đóng dấu parity tuyệt đối.
