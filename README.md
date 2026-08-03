# Cineverse — Cinema Booking Platform

Ứng dụng đặt vé xem phim full-stack, cung cấp trải nghiệm từ khám phá phim, chọn suất chiếu và ghế, thêm combo, thanh toán đến quản lý vé điện tử. Dự án được xây dựng theo hướng tách biệt frontend và REST API để dễ mở rộng nghiệp vụ vận hành rạp chiếu.

## Highlights

- Xây dựng luồng đặt vé nhiều bước: chọn phim → suất chiếu → ghế → combo → thanh toán → vé điện tử.
- Quản lý tài khoản với JWT access/refresh token, mật khẩu được băm bằng bcrypt và endpoint được bảo vệ bằng Bearer token.
- Hỗ trợ RBAC cho vai trò và quyền; hệ thống có thể mở rộng quyền thao tác theo từng nhóm nhân sự.
- Quản lý dữ liệu rạp chiếu: hệ thống rạp, khu vực, phòng chiếu, công nghệ màn hình, âm thanh, loại ghế và sơ đồ ghế.
- Quản lý danh mục phim, thể loại, định dạng, giới hạn độ tuổi và lịch chiếu; giá vé được tính từ giá phim cùng các hệ số rạp/phòng/loại ghế.
- Giữ ghế khi tạo booking và tự giải phóng các booking chưa thanh toán sau 10 phút bằng scheduled job, giúp giảm xung đột đặt ghế.
- Thanh toán trực tuyến theo luồng khởi tạo, callback và tra cứu trạng thái; hỗ trợ các phương thức như MoMo, ZaloPay, VNPay, thẻ ngân hàng và Apple Pay.
- Cung cấp vé điện tử, mã QR để nhân viên kiểm soát vé, cùng khu vực quản trị cho tác vụ vận hành.
- Cung cấp Swagger/OpenAPI cho hợp đồng API và Cloudinary cho upload avatar/hình ảnh.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Base UI, Zustand, Lucide React |
| Backend | NestJS 11, TypeScript, RESTful API, Passport JWT, class-validator, Swagger/OpenAPI |
| Data | MySQL, Prisma ORM |
| Security | JWT access/refresh token, bcrypt password hashing, ValidationPipe, protected routes, RBAC foundation |
| Media | Multer, Cloudinary |
| Background processing | `@nestjs/schedule` cron job for expired pending bookings |
| Tooling | ESLint, Prettier, Jest, Postman |

## Core User Flows

### Customer

1. Đăng ký hoặc đăng nhập để nhận JWT.
2. Khám phá danh sách phim, xem chi tiết, trailer, thể loại và giới hạn độ tuổi.
3. Chọn rạp, suất chiếu và ghế; hệ thống kiểm tra ghế đã được giữ/đặt.
4. Thêm combo, xác nhận điều khoản và điều kiện độ tuổi.
5. Khởi tạo thanh toán, xử lý callback và phát hành vé điện tử.
6. Xem lịch sử vé, mở QR code và xuất trình vé tại cổng kiểm soát.

### Admin / Staff

- Quản trị phim, thể loại, định dạng, giới hạn độ tuổi và lịch chiếu.
- Quản trị rạp, khu vực, phòng, cấu hình màn hình/âm thanh, ghế và loại ghế.
- Quản lý người dùng, role và permission; cập nhật avatar qua Cloudinary.
- Xác thực QR để kiểm soát tình trạng sử dụng của vé.

## Architecture

```text
frontend-next (Next.js App Router)
  ├─ Screens: catalogue, showtimes, booking, checkout, tickets, staff portal
  ├─ UI: Tailwind CSS + Base UI components
  └─ Client state: Zustand
             │ HTTPS / REST + Bearer JWT
             ▼
backend (NestJS modules)
  ├─ Auth, User, Role, Permission
  ├─ Movie, Cinema, Room, Seat, Showtime
  ├─ Booking, Payment, User Rating
  ├─ Validation, guards, interceptors, Swagger
  └─ Prisma
             │
             ▼
           MySQL
```

Backend được tổ chức theo module với Controller → Service → Prisma Service. Cách tách này giữ HTTP concerns, nghiệp vụ và persistence độc lập, giúp thay đổi UI hoặc nguồn dữ liệu mà không làm vỡ logic đặt vé.

## Booking & Pricing Rules

- Một ghế không thể có nhiều booking `PENDING` hoặc `PAID` cho cùng suất chiếu.
- Booking mới được khởi tạo ở trạng thái `PENDING`; cron job chạy mỗi phút và hủy booking chưa thanh toán quá 10 phút.
- Booking đã thanh toán không thể bị hủy qua API hủy booking.
- Giá suất chiếu và giá ghế được tính theo công thức:

```text
showtimeBasePrice = movieBasePrice
                  × cinemaBrandMultiplier
                  × screenTechnologyMultiplier
                  × soundSystemMultiplier
                  + cinemaAreaPriceAddition

seatPrice = showtimeBasePrice × seatTypeMultiplier
```

## Project Structure

```text
.
├─ frontend-next/          # Next.js customer and staff application
│  └─ src/
│     ├─ app/              # App Router routes
│     ├─ components/       # Booking, auth, movie, staff and UI components
│     ├─ services/         # Repository boundary for API data access
│     ├─ lib/stores/       # Zustand client state
│     └─ types/            # Domain and repository contracts
└─ backend/                # NestJS REST API
   ├─ prisma/schema.prisma # MySQL data model
   └─ src/
      ├─ common/           # Guards, interceptors, decorators, helpers, jobs
      └─ modules/          # API and system modules
```

> `frontend/` là bản giao diện cũ và không thuộc phạm vi kiến trúc hiện tại của dự án.

## Local Development

### Prerequisites

- Node.js 20+
- MySQL 8+
- Cloudinary account (chỉ cần khi thử nghiệm upload ảnh)

### 1. Configure the backend

Tạo `backend/.env`:

```env
PORT=3069
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/cineverse"

ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=replace_with_a_different_long_random_secret
REFRESH_TOKEN_EXPIRES_IN=7d

CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

API runs at `http://localhost:3069/api` and Swagger is available at `http://localhost:3069/api/api-docs`.

### 2. Run the frontend

```powershell
cd frontend-next
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Documentation

Swagger groups endpoints for Auth, Users, Roles, Permissions, Cinema infrastructure, Movies, Showtimes, Bookings, Payments and User Ratings. Use the **Authorize** button to send a Bearer access token to protected endpoints.

The project also includes a Postman collection at [`backend/postman/Capstone_NestJS-Movie_API.postman_collection.json`](backend/postman/Capstone_NestJS-Movie_API.postman_collection.json).

## Security Notes

- Never commit `.env`, JWT secrets, database credentials or Cloudinary credentials.
- In production, validate payment gateway signatures, enforce idempotency for callbacks, restrict CORS origins and store refresh tokens securely.
- For high traffic, enforce a database-level unique constraint or transactional seat-locking strategy for `(showtimeId, seatId)`; an application-level availability check alone is not sufficient across multiple backend instances.

## Portfolio Summary

**Cineverse** — Full-stack cinema booking platform built with **Next.js, NestJS, Prisma and MySQL**. Implemented JWT authentication, booking/seat-hold workflow, dynamic ticket pricing, payment status flow, role-based administration, QR ticket verification, Swagger API documentation and Cloudinary media upload.
