import Image from "next/image";
import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="home-container site-footer-grid grid">
        <div>
          <Image
            alt="CINEVERSE"
            height={26}
            width={144}
            src="/assets/logo.svg"
          />
          <p>
            Đặt vé nhanh, trải nghiệm điện ảnh trọn vẹn tại hệ thống rạp
            CINEVERSE.
          </p>
        </div>
        <FooterGroup
          title="Khám phá"
          links={[
            ["Trang chủ", "/"],
            ["Tất cả phim", "/movies"],
            ["Đang chiếu", "/movies?status=now-showing"],
            ["Sắp chiếu", "/movies?status=coming-soon"],
          ]}
        />
        <FooterGroup
          title="Hỗ trợ"
          links={[
            ["Đặt vé", "/showtimes"],
            ["Vé của bạn", "/tickets"],
            ["Vé gần nhất", "/tickets"],
            ["Tài khoản", "/auth"],
          ]}
        />
        <div>
          <h2>Kết nối</h2>
          <p>Hotline: 1900 2026</p>
          <p>Email: hello@cineverse.vn</p>
          <div className="site-social-row" aria-label="Mạng xã hội Cineverse">
            <span>f</span>
            <span>▶</span>
            <span>◎</span>
            <span>♪</span>
          </div>
        </div>
      </div>
      <div className="home-container site-footer-bottom">
        <span>© 2026 CINEVERSE. All rights reserved.</span>
        <span>Điều khoản sử dụng · Chính sách bảo mật</span>
      </div>
    </footer>
  );
}
function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <h2>{title}</h2>
      <div className="site-footer-links grid">
        {links.map(([label, href]) => (
          <Link
            key={`${href}-${label}`}
            href={href}
            className="hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
