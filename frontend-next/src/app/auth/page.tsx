"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function Page() {
  const [registered, setRegistered] = useState(false);
  const [profile, setProfile] = useState(false);
  return (
    <section className="mx-auto max-w-md px-page py-section">
      <p className="text-xs font-bold tracking-[.2em] text-primary-bright">
        CINEVERSE ACCOUNT
      </p>
      <h1 className="mt-2 text-4xl font-black">
        {profile
          ? "Tài khoản của bạn"
          : registered
            ? "Tạo tài khoản"
            : "Chào mừng trở lại"}
      </h1>
      {profile ? (
        <form className="mt-6 grid gap-3">
          <Input defaultValue="Khách Cineverse" />
          <Input defaultValue="guest@cineverse.local" />
          <Button onClick={(e) => e.preventDefault()}>Lưu thay đổi</Button>
          <Button variant="outline" onClick={() => setProfile(false)}>
            Đăng xuất mock
          </Button>
        </form>
      ) : (
        <form
          className="mt-6 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setProfile(true);
          }}
        >
          <Input placeholder="Email" type="email" required />
          <Input placeholder="Mật khẩu" type="password" required />
          {registered && <Input placeholder="Họ và tên" required />}
          <Button type="submit">{registered ? "Đăng ký" : "Đăng nhập"}</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRegistered(!registered)}
          >
            {registered
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </Button>
        </form>
      )}
    </section>
  );
}
