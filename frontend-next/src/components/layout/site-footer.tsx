import Image from "next/image";
import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface px-page py-10">
      <div className="mx-auto grid w-full max-w-340 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            alt="CINEVERSE"
            height={26}
            width={144}
            src="/assets/logo.svg"
          />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
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
          <p className="mt-4 text-sm text-muted-foreground">
            Hotline: 1900 2026
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            hello@cineverse.vn
          </p>
          <p className="mt-4 text-sm text-muted-foreground">f · ▶ · ◎ · ♪</p>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-340 flex-wrap justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <span>© 2026 CINEVERSE. All rights reserved.</span>
        <span>Điều khoản sử dụng · Chính sách bảo mật</span>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="hover:text-foreground">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
