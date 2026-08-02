import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface px-page py-10">
      <div className="mx-auto grid w-full max-w-[85rem] gap-8 md:grid-cols-[1fr_auto]">
        <div className="flex max-w-md flex-col gap-3">
          <p className="text-lg font-black tracking-[-0.08em]">CINE<span className="text-primary">VERSE</span></p>
          <p className="text-sm leading-6 text-muted-foreground">Chọn một câu chuyện, chọn một chỗ ngồi, để lại thế giới bên ngoài phía sau.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
          <Link href="/movies" className="hover:text-foreground">Lịch chiếu</Link>
          <Link href="/tickets" className="hover:text-foreground">Vé của tôi</Link>
          <Link href="/auth" className="hover:text-foreground">Tài khoản</Link>
        </div>
      </div>
    </footer>
  );
}
