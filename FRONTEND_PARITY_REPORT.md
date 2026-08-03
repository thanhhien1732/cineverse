# FRONTEND PARITY REPORT

**Phạm vi:** đối chiếu source-level giữa `frontend/` (HTML/CSS/JS legacy) và `frontend-next/` (Next.js App Router) cho 12 trang legacy.
**Thời điểm:** 2026-08-03.
**Phương pháp:** đọc toàn bộ 12 HTML, các entry JavaScript theo trang, `core.js`, `data.js`, `styles.css`, toàn bộ route/component/repository/state ở frontend mới; kiểm tra tồn tại file asset theo các URL hiện được tham chiếu. Công cụ automation browser không sẵn sàng trong môi trường audit, do đó đây **không phải** pixel-diff hoặc kiểm chứng camera/QR runtime. Các kết luận visual là đối chiếu cấu trúc và CSS/source có thể kiểm chứng.

## Kết luận điều hành

Frontend mới đã hoàn thành **route coverage 12/12** và dùng nhất quán App Router, Tailwind v4, shadcn/ui cơ sở, typed mock repository và Zustand session persistence. Tuy nhiên, đây chưa phải migration có feature/visual parity 1:1: các trang catalog giữ được phần lõi tốt hơn, trong khi booking, ticket, staff/admin và QR verification mới ở mức MVP.

**Không nên đóng băng Frontend ở trạng thái hiện tại.** Có các thiếu hụt P0 làm đứt hoặc làm sai nghiệp vụ: link chọn suất chiếu sai, booking không bảo vệ bước tiếp theo, checkout/ticket quá rút gọn, và Ticket Verification không có scanner hoặc kiểm soát quyền.

## 1. Visual & Layout Parity

### Shared shell

| Khu vực | Legacy | Next.js | Đánh giá |
| --- | --- | --- | --- |
| Header | Logo SVG, desktop nav 4 mục, avatar/tên theo session, badge vé/booking, mobile drawer, active link, sticky/scrolled state (`frontend/js/core.js`) | Wordmark text, nav 3 mục, search desktop, icon Auth, nút vé tĩnh; sticky backdrop (`src/components/layout/site-header.tsx`) | **Một phần.** Thiếu logo asset, mobile nav, active state, account state/avatar và booking badge/resume link. Search là bổ sung mới hợp lý nhưng không thay thế các hành vi thiếu. |
| Footer | 4 cột: brand, khám phá, hỗ trợ, liên hệ/social + copyright/legal | Brand copy + 3 link trong 2 cột (`site-footer.tsx`) | **Không tương đương.** Thiếu nhóm hỗ trợ/liên hệ/social/legal và logo. |
| Booking shell | Booking hero, 5 bước có trạng thái, content + sticky summary sidebar (`showtimes.html`, `core.js`) | Section đơn cột, chỉ tiêu đề route (`booking-flow.tsx` callers) | **Không tương đương.** Không còn progress indicator, context/summarization layout và sidebar. |
| Staff shell | `admin.html` là staff login độc lập; `verify.html` có gate header, operator và logout | Cả `/admin` và `/verify` dùng public Header/Footer | **Không tương đương, đồng thời sai ranh giới nghiệp vụ.** Gate Control cần shell staff riêng và auth guard. |

### Design tokens, typography, spacing và responsive

| Hạng mục | Bằng chứng | Đánh giá |
| --- | --- | --- |
| Color palette | Legacy `styles.css:2-17` và `src/styles/tokens.css` cùng các giá trị nền `#05070d`, surface `#0c111d`, text `#f7f9ff`, primary `#6f7cff`, blue/purple/success/warning/danger | **Khớp cao.** Các màu cốt lõi và radius/shadow được chuyển trực tiếp. |
| Typography | Legacy dùng các scale/component typography chuyên biệt; mới chỉ khai báo `Inter, ui-sans-serif, system-ui` và utility font weights | **Khớp một phần.** Hierarchy dark/cinematic được giữ, nhưng không chứng minh được font Inter thực được nạp, và scale/line-height không map 1:1. |
| Spacing & sizing | Legacy: max width 1360px, header 78px, radius 18px; mới: max width `85rem` (=1360px), radius `1.125rem` (=18px), nhưng header `min-h-18` (=72px), section `5.75rem` | **Khớp một phần.** Container/radius đúng; header và section rhythm đã thay đổi. |
| Breakpoints | Legacy có 1120, 920, 720, 680, 640, 520, 430, 380px; mới chỉ có custom xs=380, tablet=680, desktop=1120px và dùng thêm Tailwind `sm/md/lg/xl` mặc định | **Không 1:1.** Có coverage responsive cơ bản, nhưng thiếu các breakpoint/behavior chuyên biệt 920/720/640/520/430. |
| Responsive behavior | Legacy có mobile drawer, layout booking/sidebar collapse, print rules; mới dùng grid utilities tại vài route | **Chưa đủ bằng chứng parity.** Không có snapshot desktop/tablet/mobile; các layout booking/ticket/staff quan trọng đã bị giản lược. |

## 2. Đối chiếu từng trang và interaction

| # | Legacy → Route mới | Layout/visual | Feature legacy đối chiếu | Trạng thái parity | Chênh lệch cần xử lý |
| --- | --- | --- | --- | --- |
| 1 | `index.html` → `/` | Hero + now showing + coming soon + newsletter còn; layout hero thay carousel bằng hero tĩnh | `home.js`: hero prev/next/preview, featured-video modal, experience strip, promo strip, trailer list, newsletter alert | **Một phần** | Thiếu carousel controls, experience section, featured videos/trailer modal trên home, promo strip; newsletter submit mới không có feedback. |
| 2 | `movies.html` → `/movies` | Page heading/catalog grid còn, filter layout đổi từ tab+select sang controls trong card | `movies.js`: status tabs, search, genre, hash filter, empty state | **Gần đạt lõi** | Lọc status/search/genre có; format filter là bổ sung. Thiếu trạng thái tab/hash (`#now-showing`, `#coming-soon`) và visual tab legacy. |
| 3 | `movie-detail.html` → `/movies/[id]` | Hero/poster/info/showtime preview được dựng lại | `detail.js`: detail render, related movies, trailer modal | **Một phần** | Trailer dialog có. Thiếu related movies. Nút `Chọn suất chiếu` trỏ đến **`/booking/showtimes` không tồn tại** (route đúng là `/showtimes`); button chọn suất chiếu trong aside không có action. |
| 4 | `showtimes.html` → `/showtimes` | Legacy có booking top, movie/date/cinema panels và summary sidebar; mới chỉ list một showtime | `showtimes.js`: movie picker, 7-day picker, cinema grouping, showtime selection, summary, age-restriction state | **Không đạt** | Chỉ hard-code showtime của `minions-monsters`; thiếu chọn phim/ngày/rạp/format, 7 ngày, age restriction, summary và booking steps. |
| 5 | `seats.html` → `/booking/[showtimeId]/seats` | Có grid 30 ghế; thiếu screen/context/legend/sidebar | `seats.js`: seat map, reserved/VIP/couple/selected, context, summary, continue handler | **Một phần, chưa đủ luồng** | Có toggle và total realtime; chỉ 1 ghế reserved, couple/VIP không được chú thích/hiển thị đầy đủ. Link tiếp tục cho đi combo kể cả chưa chọn ghế; không có booking context/summary/legend/steps. |
| 6 | `combos.html` → `/booking/combos` | Legacy combo grid có hình và summary sidebar; mới list text 2 combo | `combos.js`: render toàn bộ combo, +/- quantity, summary/continue | **Một phần** | +/- quantity có. Thiếu 2/4 combo legacy, ảnh combo, summary/sidebar và lựa chọn bỏ qua hiển thị rõ. |
| 7 | `checkout.html` → `/booking/checkout` | Legacy checkout form + order summary; mới chỉ button mock khi có ghế | `checkout.js`: account/rewards/points, age eligibility, card/MoMo panel+QR modal, terms validation, create ticket | **Không đạt** | Thiếu toàn bộ contact/account, rewards, age confirmation, payment method/card form/MoMo modal, terms validation và order total/combo summary. Guard chỉ hiển thị text khi không ghế, không điều hướng về chọn ghế. |
| 8 | `ticket.html` → `/ticket/[id]` | Legacy ticket layout/QR/print; mới card cơ bản và ma trận ô màu | `ticket.js`: ticket data, empty state, print | **Không đạt** | Không dùng `id` route để resolve ticket; QR là placeholder không quét được; thiếu metadata đầy đủ, booking steps, print và empty-state CTA tương đương. |
| 9 | `tickets.html` → `/tickets` | Legacy danh sách ticket; mới chỉ một ticket hiện trong store | `tickets.js`: upcoming tickets list và empty state | **Không đạt** | Không có repository/history nhiều vé, thời gian/trạng thái/QR/card layout legacy. |
| 10 | `auth.html` → `/auth` | Legacy auth hero + security note + rich auth/profile panel; mới form một cột | `auth.js`: login/register switch, validation, avatar/profile fields, logout, update profile | **Một phần** | Có đổi login/register/profile mock. Thiếu hero/security note, user fields/avatar/profile detail, validation/message tương đương và session/account state xuyên Header. |
| 11 | `admin.html` → `/admin` | Legacy là staff login/initial-admin flow; mới là dashboard tĩnh | `staff.js` + `admin.js`: initial admin, login, session, logout, safe redirect | **Không đạt / khác nghiệp vụ** | Không có staff login, auth guard, session/logout hoặc management CRUD. Dashboard stats mock không tương đương portal legacy; không nên coi là thay thế bảo mật. |
| 12 | `verify.html` → `/verify` | Legacy gate shell, scanner card và result workspace; mới manual-input card | `verify.js`: camera start/stop, image QR upload, manual validation, success/error/used states, cleanup | **Không đạt** | Không có camera, QR upload/decode, staff authorization, gate header/operator/logout, ticket lookup hoặc trạng thái already-used/invalid. Hiện mọi mã hợp lệ về cùng một success mock. |

## 3. Static Assets & Mock Data

### Kiểm tra đường dẫn đang được Next.js tham chiếu

Các URL `/assets/...` hiện tham chiếu trong `src/` đều có file tương ứng trong `frontend-next/public` (poster/backdrop/video Minions, poster 6 phim, newsletter background). Vì vậy **không phát hiện URL asset đang tham chiếu bị missing trên filesystem**.

Tuy nhiên, có hai vấn đề dữ liệu/hình ảnh quan trọng:

1. `mock-catalogue.repository.ts` chỉ có **6 phim**, trong khi `frontend/js/data.js` có **12 phim**. Sáu phim thiếu: `you-me-tuscany`, `focker-in-law`, `one-night-only`, `five-nights-at-freddys-2`, `wicked-for-good`, `black-phone-2`.
2. Ba phim đã giữ lại dùng backdrop thay thế sai: `super-mario-galaxy` và `reminders-of-him` dùng backdrop Minions; `forgotten-island` dùng backdrop The Odyssey. Asset legacy đúng cho các phim này không được copy sang `frontend-next/public`.

### Asset inventory chênh lệch

- Legacy có **583** assets; `frontend-next/public/assets` có **15** assets.
- Các nhóm chưa migrate gồm logo/favicon, 4 ảnh combo, 8 promo banners, `newsletter-earth`/noise texture, phần lớn poster/backdrop, và 11 trailer video.
- 512 QR SVG legacy hiện không có bản public Next.js. Dù không nhất thiết cần copy tất cả nếu QR sẽ sinh động từ dữ liệu, trạng thái hiện tại không có giải pháp QR thật thay thế.
- `data.js` legacy có cinemas, combos, featured videos, promos và movie fields phong phú; mock repositories mới chỉ biểu diễn catalogue 6 phim, 1 cinema, 1 showtime, 2 combo hard-code trong component. Đây là nguyên nhân trực tiếp của nhiều thiếu hụt UI/feature ở trên.

## 4. Danh sách discrepancy trước khi đóng băng

| Ưu tiên | Hạng mục | Lý do / hành động đề xuất |
| --- | --- | --- |
| P0 | Sửa link detail `'/booking/showtimes'` → `'/showtimes'` và gắn action chọn suất chiếu | Hiện tạo 404 và chặn funnel đặt vé từ movie detail. |
| P0 | Hoàn chỉnh pipeline showtimes → seats → combos → checkout → ticket bằng cùng mock repository | Cần movie/date/cinema/showtime selection, booking summary, validation trước tiến bước và total bao gồm combo. |
| P0 | Thay checkout/ticket MVP bằng form/summary/terms/payment mock, QR render và print state tương đương | Luồng thanh toán hiện chưa biểu diễn nghiệp vụ legacy. |
| P0 | Tách staff shell, mock staff session/guard, và xây đủ verify result states | Không dùng public route/“always valid” mock cho gate control; production sau này phải thay mock bằng API authorization và server-side ticket validation để tránh bypass. |
| P1 | Khôi phục đủ `data.js` thành typed mock fixtures và migrate asset cần dùng | Bảo đảm catalog 12 phim, 4 combo, promos, poster/backdrop/trailer đúng mỗi phim. Không copy QR legacy hàng loạt nếu thay bằng generator thực. |
| P1 | Hoàn chỉnh shared Header/Footer/mobile/booking steps | Khôi phục mobile drawer, account/booking state, footer links, active navigation và responsive parity. |
| P1 | Khôi phục home experiences/promos/featured videos và detail related movies | Đây là các section nhìn thấy rõ bị mất trong migration. |
| P1 | Hoàn thiện Auth/Profile và Tickets history | Bổ sung field/profile/feedback mock, history nhiều ticket và liên kết Header state. |
| P2 | Chạy visual regression ở desktop/tablet/mobile sau khi sửa P0/P1 | So ảnh 1440px, 920px và 680px (cộng các breakpoint 520/430/380 khi có layout đặc thù) trước khi xác nhận visual parity. |

## Quyết định đóng băng

**Kết quả: BLOCKED.** Route migration hoàn tất nhưng Visual & Feature Parity chưa đạt mức chấp nhận được để đóng băng Frontend. Ưu tiên xử lý P0 trước, sau đó khôi phục data/assets và shared responsive shell; cuối cùng chạy browser visual regression và E2E mock cho các interaction nêu trên.
