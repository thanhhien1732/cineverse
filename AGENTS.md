# 🧠 CINEVERSE - AGENTS DEFINITION & RULES

## 1. Mục tiêu & Tech Stack
Tài liệu định nghĩa vai trò của AI Agent và cấu trúc kỹ thuật tinh gọn cho dự án Fullstack `cineverse`.
- **Ngôn ngữ cốt lõi:** JavaScript (ES6+), TypeScript, HTML5, CSS3/SASS.
- **Frontend Target:** Next.js (App Router), Tailwind CSS, shadcn/ui.
- **Backend Target:** NestJS.
- **Database & ORM:** MySQL, Prisma ORM.
- **Security:** JWT, Passport.js, Bcrypt.
- **Cloud & DevOps:** Docker, AWS, Cloudinary (Lưu trữ ảnh/video).
- **Công cụ Core:** Multer (Upload file), Git, Postman, TablePlus, Swagger UI.
- **Công cụ Mở rộng (Optional):** Nodemailer (Gửi mail), WebSocket (Realtime) - *Chỉ sử dụng khi nghiệp vụ yêu cầu rõ ràng*.
- **Quy tắc thiết kế:** OOP, MVC, RESTful API.
- **Quy tắc AI:** Không tự suy đoán (no hallucination). Phải hỏi lại khi thiếu dữ kiện. Bắt buộc xác minh (verify/build/test) trước khi kết luận hoàn thành.

## 2. Chi tiết công việc theo từng Phase

### Phase 0: Audit & Migration (Brownfield Project)
- **Frontend Migration:** Phân tích mã nguồn HTML/SASS cũ. Dùng `@request-refactor-plan` xuất lộ trình "chặt" HTML/SASS thành các Next.js Component (kèm Tailwind CSS) chuẩn chỉnh trước khi code.
- **Backend Audit:** Đóng vai trò Senior Tech Lead. Dùng `@improve-codebase-architecture` soi kiến trúc OOP/MVC của NestJS, `@code-review` quét lỗi, và `@domain-modeling` đánh giá lại cấu trúc Prisma Schema trên MySQL.

### Phase 1: Requirements & Planning
- Bắt đầu với `@to-questionnaire` rà soát các Edge Cases.
- Chốt yêu cầu bằng `@to-spec` (Tech Spec/PRD) và chia nhỏ Task bằng `@to-tickets`.

### Phase 2: Architecture & Domain
- Dùng `@improve-codebase-architecture` định hình luồng thư mục Monorepo.
- Dùng `@domain-modeling` thiết kế Prisma Schema.
- Thống nhất thuật ngữ bằng `@ubiquitous-language` và định nghĩa type với `@typescript-advanced-types`.

### Phase 3A: Frontend Development
- Triển khai UI Components bám sát Tailwind CSS và `shadcn/ui`.
- Áp dụng quy tắc UX (`@ui-ux-pro-max`) và chuyển động (`@emil-design-eng`).
- Tuân thủ ranh giới Next.js Component (`@vercel-composition-patterns`, `@vercel-react-best-practices`).
- Chèn code đo lường (`@analytics`), siêu dữ liệu (`@schema`), và tối ưu SEO (`@seo-audit`).

### Phase 3B: Backend Development (NestJS & RESTful API)
- **Luồng dữ liệu (MVC/OOP):** Triển khai Controller, Service, Repository logic.
- **Auth & Security:** Cấu hình bảo mật chặt chẽ bằng JWT, Passport.js và Bcrypt.
- **Media Processing:** Sử dụng Multer để hứng file từ client, tải trực tiếp stream lên Cloudinary và lưu URL vào database.
- **Optional Utility:** Cấu hình Nodemailer và WebSocket khi có ticket yêu cầu tính năng đặc thù.
- Cập nhật Swagger UI để Frontend có hợp đồng giao tiếp chuẩn xác.

### Phase 4: Testing & Debugging
- Viết test trước bằng `@tdd`. Test API qua Postman.
- Dùng `@agent-browser` mở trình duyệt giả lập test E2E.
- Dùng `@diagnosing-bugs` truy vết root-cause khi gặp lỗi hóc búa.

### Phase 5: Verification & Review
- BẮT BUỘC gọi `@verification-before-completion` để tự build/type-check.
- Cấu hình format code chuẩn (`@setup-pre-commit`). Rà soát chất lượng bằng `@code-review`.

### Phase 6: DevOps & Deployment (Docker / AWS)
- Viết `Dockerfile` (Multi-stage build). Next.js (standalone), NestJS (production).
- Quản lý môi trường Local bằng `docker-compose.yml` (bao gồm MySQL & App).
- Cấu hình biến môi trường (`.env`), health checks và chuẩn bị deploy lên AWS.