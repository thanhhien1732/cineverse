# Frontend Refactor Plan — Cineverse

## Problem Statement

Frontend hiện tại là một ứng dụng vanilla HTML/CSS/JavaScript gồm 12 trang,
một stylesheet hơn 7.000 dòng, JavaScript theo từng trang, mock data tập trung
trong `data.js`, và state được lưu bằng browser storage. Mục tiêu là chuyển toàn
bộ UI/UX và route sang Next.js App Router với TypeScript, Tailwind CSS và
shadcn/ui, nhưng vẫn chạy hoàn toàn bằng mock data. Kết nối NestJS API là một
giai đoạn riêng sau khi giao diện, luồng và API contract được phê duyệt.

## Solution

Tạo một frontend Next.js độc lập trong thư mục frontend mới, giữ legacy
frontend ở trạng thái chỉ-đọc cho đến khi feature tương ứng đã được đối chiếu.
Kiến trúc mới ưu tiên Server Components cho cấu trúc và dữ liệu mock chỉ-đọc;
chỉ các vùng tương tác mới là Client Components. State nghiệp vụ phía browser
được gom vào các store theo feature, còn dữ liệu mock đi qua repository
interface để có thể thay bằng NestJS adapter mà không làm thay đổi component.

### Phạm vi và giả định đã chốt

- Mục tiêu UI là tái tạo đầy đủ hành vi legacy trước; không redesign nghiệp vụ
  hoặc thay đổi database/API trong Phase 0 frontend.
- Dữ liệu mẫu hiện hữu là nguồn ban đầu; trước khi dùng sẽ được chuẩn hoá thành
  TypeScript domain models, không import trực tiếp globals từ legacy scripts.
- Hệ thống phải giữ được luồng booking qua reload trong cùng browser session.
- Không mang cơ chế legacy `/api/storage/*`, local shared JSON storage, hoặc
  certificate development vào Next.js như một integration contract.
- Chưa cài package, chưa khởi tạo Next.js, chưa di chuyển asset và chưa xoá
  frontend legacy trong phạm vi kế hoạch này.

### Lựa chọn đã cân nhắc

- **Chuyển dần trong frontend legacy:** ít thay đổi ban đầu nhưng tạo hai runtime
  và hai hệ CSS khó bảo trì. Không chọn.
- **Chuyển toàn bộ UI rồi mới nối API:** được chọn theo chiến lược đã xác nhận;
  giúp khoá trải nghiệm trước khi phụ thuộc vào backend có rủi ro domain.
- **Biến mọi route thành Client Component:** không chọn vì làm mất lợi ích App
  Router. Client boundary chỉ đặt tại forms, filters, media controls và state.
- **Dùng Sass làm nguồn token thứ hai:** không chọn. CSS variables/Tailwind là
  nguồn token duy nhất; Sass chỉ là lớp chuyển tiếp cục bộ khi utility không
  diễn tả tốt một style legacy.

## Routing and Rendering Map

| Legacy page | Target App Router route | Page rendering | Client boundaries |
| --- | --- | --- | --- |
| `index.html` | `/` | Server Component | Hero carousel, trailer modal, newsletter form |
| `movies.html` | `/movies` | Server Component | Search, genre/status filters, URL search params |
| `movie-detail.html` | `/movies/[slug]` | Server Component | Trailer modal, booking CTA |
| `showtimes.html` | `/booking/showtimes` | Server shell | Date picker, movie/cinema/showtime selection |
| `seats.html` | `/booking/seats` | Server shell | SeatPicker and booking summary |
| `combos.html` | `/booking/combos` | Server shell | Combo quantities and booking summary |
| `checkout.html` | `/booking/checkout` | Server shell | Payment method, points, age/terms confirmation, MoMo demo modal |
| `ticket.html` | `/tickets/[ticketCode]` | Server Component | Print action and optional QR presentation control |
| `tickets.html` | `/tickets` | Server Component | Ticket filter/list client island where required |
| `auth.html` | `/auth` | Server shell | Sign-in, registration, profile and logout forms |
| `admin.html` | `/staff` | Server shell | Staff sign-in and staff-management workspace |
| `verify.html` | `/staff/verify` | Server shell | Camera/file QR scanning and verification form |

Booking state is deliberately represented by `/booking/*` rather than hidden
legacy filename navigation. The selected movie/showtime may be reflected in
validated search parameters for deep links, but the canonical selected booking
is held by the booking store. Legacy URLs may later receive redirects only after
the new routes are accepted.

### Server/Client boundary rules

- `layout`, static content, route metadata, mock catalogue lookup and initial
  route validation stay on the server by default.
- Any component using browser storage, event listeners, camera APIs, video
  controls, form state or a Zustand store gets its own `use client` boundary.
- A page never becomes client-only merely to pass interactive state downward.
  Interactive islands receive serializable props from their Server Component.
- Staff and authentication mock state are presentation-only. They are never a
  security boundary; server-side authorization will be introduced with real auth.

## Proposed Component Architecture

```text
app
  (public)       catalogue, movie detail and account routes
  (booking)      showtime, seat, combo and checkout routes
  (staff)        staff console and ticket verification routes
  tickets        ticket history and ticket-detail routes
components
  layout         public header, footer, mobile navigation, page shell
  movies         MovieCard, MovieGrid, MovieFilters, MovieHero, TrailerModal
  booking        BookingProgress, ShowtimePicker, SeatPicker, ComboPicker,
                 BookingSummary, PaymentMethodPicker, CheckoutForm
  tickets        TicketCard, TicketDetail, TicketQr, PrintTicketButton
  auth           AuthForm, RegisterForm, ProfileForm, LogoutControl
  staff          StaffLoginForm, StaffUserManager, TicketVerifier, QrScanner
  ui             shadcn/ui primitives and project wrappers
features
  catalogue, booking, tickets, auth, staff
lib
  mock-data, repositories, validation, formatting, route helpers
types
  domain models and repository contracts
```

Reusable layout components own navigation and visual framing only. Feature
components own business interaction. `SeatPicker` receives a typed seat map and
selection callback; it does not access storage or mock data directly. This
separation keeps it usable when the source changes from mock data to a live
seat-availability endpoint.

## Design Tokens and Styling Migration

### Token extraction

1. Inventory every repeated colour, spacing, radius, shadow, typography scale,
   breakpoint, z-index layer and animation duration in the legacy stylesheet.
2. Define semantic CSS variables for those values: surface, foreground, muted,
   brand, accent, success, warning, danger, border, focus, overlay and cinema
   seat states. Do not name tokens after a specific page.
3. Map semantic variables into Tailwind theme utilities and shadcn/ui colour
   variables. Light/dark decisions are made once at the application theme layer.
4. Record component variants with Tailwind utilities and CVA-style variants,
   rather than cloning page-specific class blocks.

### CSS decomposition order

1. Global reset, typography, body/background and container rules.
2. Header, footer, button, form field, badge, modal and responsive navigation.
3. Movie catalogue/card/hero and media-preview styles.
4. Booking summary, showtime, seat map, combo and checkout styles.
5. Ticket printing, staff dashboard and QR verification styles.
6. Responsive and print rules, verified independently at desktop, tablet and
   mobile breakpoints.

Tailwind utilities are the default implementation. CSS modules or SCSS files are
allowed only for genuinely complex local styling such as seat-map geometry,
print output and narrowly scoped animation; they must consume the same CSS
variables and may not create a second design-token system. The monolithic legacy
stylesheet remains intact until every mapped section has visual parity.

## Next.js Foundation Plan

When approved, create the new app with the current `create-next-app` flow using
TypeScript, ESLint, App Router and Tailwind CSS. Configure a `src` directory and
an import alias. Then add shadcn/ui using its official initializer and generate
only primitives that are actually used: Button, Input, Select, Dialog, Sheet,
Tabs, Tooltip, Badge, Card, Form, Skeleton and Toast/Sonner.

The initial configuration must include strict TypeScript, image remote-pattern
rules only if required by migrated content, accessible font loading, metadata
defaults, and a public asset migration policy. No backend base URL, secrets,
JWTs or Cloudinary credentials are added during this mock-data phase.

## State and Mock Data Strategy

### Typed mock data

- Translate legacy movie, cinema, showtime, seat, combo, ticket and staff data
  into typed immutable fixtures organised by feature.
- Define domain types such as `Movie`, `Showtime`, `Seat`, `BookingDraft`,
  `ComboSelection`, `Ticket`, `UserSession` and `StaffSession`; avoid `any`.
- Define repository interfaces, for example catalogue lookup, showtime lookup,
  ticket lookup and authentication operations. Mock implementations satisfy
  those contracts and return asynchronous results to model future API behavior.
- Components depend on repository contracts or typed props, never legacy data
  globals. A future NestJS adapter replaces the implementation only.

### Browser state

Use one persisted Zustand store per independently changing client domain:

- `bookingStore`: movie, showtime, seats, combos, computed totals and checkout
  confirmations; persisted to `sessionStorage` with an explicit version.
- `authStore`: mock UI session and remember-me preference; no real token model.
- `staffStore`: mock staff session and verification workspace; session-scoped.
- `uiStore`: modal, drawer and transient UI state; never persisted.

Store actions must enforce UI invariants locally: a seat cannot be added twice,
changing showtime invalidates incompatible seat selections, and checkout is not
enabled until required confirmations are true. Prices are displayed from typed
mock data, but the plan treats all client totals as non-authoritative; the
backend will recalculate them after integration.

## Testing Decisions

There is no existing frontend automated test suite. Good tests will assert user
visible behaviour rather than implementation details: navigating to a movie,
filtering results, choosing valid seats, carrying a booking through checkout,
persisting/recovering a draft, and verifying keyboard/accessibility behaviour.

Proposed test stack for approval: Vitest + React Testing Library for feature
components/stores and Playwright for public, booking and staff critical flows.
Visual verification must cover desktop, tablet, mobile, modal-open, print-ticket
and reload/persisted-booking states. The exact test tooling is a decision gate
before implementation because no prior frontend test convention exists.

## Commits

Each commit is intentionally small and should preserve a buildable application.

1. Add the isolated Next.js application foundation with strict TypeScript and
   Tailwind; retain legacy frontend untouched.
2. Configure shadcn/ui, root theme variables and application metadata.
3. Add typed domain models, immutable mock fixtures and repository interfaces.
4. Implement public application shell: header, footer and responsive navigation.
5. Implement home route and reusable movie presentation primitives.
6. Implement movie catalogue route with URL-driven filters and search.
7. Implement movie detail route, trailer modal and booking entry point.
8. Add booking layout, persisted booking store and progress/summary components.
9. Implement showtime selection against mock repositories.
10. Implement accessible seat picker and seat-selection constraints.
11. Implement combo picker and deterministic mock price summary.
12. Implement checkout form, payment-selection UI and demo payment modal.
13. Implement ticket detail, ticket history and print-specific styling.
14. Implement account/auth UI against mock auth repository.
15. Implement staff access, staff management UI and ticket verification UI.
16. Migrate responsive, motion and print parity page by page; remove only the
    verified legacy CSS portions from the new codebase.
17. Add unit and E2E tests for the accepted high-risk booking/auth/staff flows.
18. Conduct visual parity review, accessibility review and migration handoff.

## Out of Scope

- NestJS controller, service, Prisma schema, MySQL migration or payment-gateway
  changes.
- Real authentication, JWT persistence, RBAC enforcement or staff authorization.
- Live inventory, seat locking, payment confirmation and production QR security.
- Docker, deployment, DNS, CI/CD and removal of legacy frontend.
- Creating packages, source code, pull requests or GitHub issues before approval.

## Further Notes

The plan deliberately separates UI fidelity from backend correctness. It allows
the team to validate routes and interaction design early, while preserving a
clean replacement point for the backend. When API work begins, a contract audit
must precede adapter implementation, especially for booking concurrency,
authorization and price calculation.
