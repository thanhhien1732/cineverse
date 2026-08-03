# 🚀 CINEVERSE - AGENT WORKFLOW (MINDMAP)

Sơ đồ luồng công việc dành cho AI Agent. Giai đoạn hiện tại ưu tiên xử lý Phase 0 để chuẩn hóa nợ kỹ thuật (Tech Debt) và di chuyển mã nguồn (Migration) trước khi phát triển tính năng mới.

┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 0: AUDIT & MIGRATION (ƯU TIÊN HIỆN TẠI)                          │
│                                                                        │
│   [FRONTEND: HTML/SASS ──> Next.js / Tailwind CSS]                     │
│   1. request-refactor-plan       ──> Lập bản đồ chuyển đổi HTML/CSS    │
│                                      thành Next.js Components.         │
│                                                                        │
│   [BACKEND: NestJS Code Review]                                        │
│   2. improve-codebase-architecture ──> Rà soát cấu trúc OOP, MVC,      │
│                                      Module, Controller của hệ thống.  │
│   3. code-review                 ──> Quét lỗi Clean Code, Performance. │
│   4. domain-modeling             ──> Kiểm tra tối ưu Prisma Schema.    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: REQUIREMENTS & PLANNING (Tính năng mới)                       │
│                                                                        │
│   1. to-questionnaire            ──> Phỏng vấn làm rõ Edge Cases       │
│   2. to-spec                     ──> Viết tài liệu Tech Spec/PRD       │
│   3. to-tickets                  ──> Chia nhỏ Spec thành các Tasks     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: ARCHITECTURE & DOMAIN (NestJS + Prisma + MySQL)               │
│                                                                        │
│   1. improve-codebase-architecture ──> Tổ chức thư mục Monorepo        │
│   2. domain-modeling             ──> Thiết kế Prisma Schema (MySQL)    │
│                                      & Các Relations.                  │
│   3. ubiquitous-language         ──> Chuẩn hóa thuật ngữ dự án         │
│   4. typescript-advanced-types   ──> Định nghĩa Type/Interface cho DTOs│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3A: FRONTEND DEVELOPMENT (Next.js / Tailwind CSS / shadcn / SEO)  │
│                                                                         │
│   [UI/UX & DESIGN]                                                      │
│   1. frontend-design             ──> Dựng Bố cục & Wireframe UI         │
│   2. ui-ux-pro-max               ──> Thiết kế UX luồng phức tạp         │
│   3. tailwind-design-system      ──> Quản lý Design Tokens & CVA        │
│   4. shadcn                      ──> Dựng UI Components chuẩn enterprise│
│   5. emil-design-eng             ──> Tối ưu Micro-interactions & Motion │
│                                                                         │
│   [NEXT.JS CORE & PERFORMANCE]                                          │
│   6. vercel-composition-patterns ──> Quản lý Server/Client Boundary     │
│   7. vercel-react-best-practices ──> Tối ưu Render, Caching & State     │
│   8. web-design-guidelines       ──> Rà soát UX, Accessibility (a11y)   │
│                                                                         │
│   [MARKETING & SEO]                                                     │
│   9. schema                      ──> JSON-LD Structured Data (Movie)    │
│  10. analytics                   ──> Code Event Tracking (GA4)          │
│  11. seo-audit                   ──> Kiểm tra sitemap, robots, metadata │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3B: BACKEND DEVELOPMENT (NestJS / Prisma / RESTful API)          │
│                                                                        │
│   1. API Design & OpenAPI        ──> Viết API & Swagger UI Docs        │
│   2. Auth & Security             ──> Setup JWT, Passport.js, Bcrypt    │
│   3. Media Storage               ──> Dùng Multer + Cloudinary xử lý ảnh│
│   4. Optional Features           ──> Setup WebSocket / Nodemailer      │
│                                      (Chỉ triển khai khi nghiệp vụ yêu │
│                                      cầu cụ thể).                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: TESTING & DEBUGGING                                           │
│                                                                        │
│   1. tdd                         ──> Viết Unit/Integration Test trước  │
│   2. agent-browser               ──> Mở browser giả lập test E2E flow  │
│   3. diagnosing-bugs             ──> Truy vết nguyên nhân gốc rễ lỗi   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: VERIFICATION & REVIEW                                         │
│                                                                        │
│   1. verification-before-completion ──> Ép chạy Build/Test thực tế     │
│   2. code-review                 ──> Rà soát bảo mật & Clean code      │
│   3. setup-pre-commit            ──> Cấu hình Husky, Lint, Prettier    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: DEVOPS & DEPLOYMENT (Docker / AWS)                            │
│                                                                        │
│   1. Dockerfile (Frontend)       ──> Build Next.js (Standalone mode)   │
│   2. Dockerfile (Backend)        ──> Build NestJS (Multi-stage)        │
│   3. docker-compose.yml          ──> Chạy đồng bộ toàn bộ Stack Local  │
│   4. Cloud Config                ──> Deploy AWS, Cấu hình biến môi     │
│                                      trường, Setup Healthcheck         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
[UTILITY SKILLS - Global Context]
  * Find Skills ──> Trợ lý tìm kiếm thêm các Agent Skill mới nếu phát sinh
                    yêu cầu đặc thù không nằm trong các Phase trên.
