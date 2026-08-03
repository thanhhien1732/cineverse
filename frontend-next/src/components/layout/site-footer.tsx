import Image from "next/image";
import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="site-footer px-page">
      <div className="site-footer-grid mx-auto grid w-full max-w-340 sm:grid-cols-2 lg:grid-cols-4">
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
            ["Vé của tôi", "/tickets"],
            ["Tài khoản", "/auth"],
          ]}
        />
        <div>
          <h2 className="font-semibold">Kết nối</h2>
          <p>Hotline: 1900 2026</p>
          <p>hello@cineverse.vn</p>
          <p className="site-social-row">f · ▶ · ◎ · ♪</p>
        </div>
      </div>
      <div className="site-footer-bottom mx-auto flex w-full max-w-340 flex-wrap justify-between gap-3">
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
          <Link key={href} href={href} className="hover:text-foreground">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
