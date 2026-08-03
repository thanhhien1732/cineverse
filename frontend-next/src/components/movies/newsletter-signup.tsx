"use client";

import { type FormEvent, useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmail("");
    window.alert("Đăng ký nhận tin thành công.");
  }

  return (
    <section className="home-newsletter">
      <div className="home-container home-newsletter-inner">
        <p className="eyebrow">BẢN TIN CINEVERSE</p>
        <h2>Đừng bỏ lỡ suất chiếu tiếp theo</h2>
        <p>
          Nhận thông báo về phim mới, ưu đãi combo và các suất chiếu đặc biệt từ
          CINEVERSE.
        </p>
        <form className="home-newsletter-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="newsletter-email">
            Email đăng ký
          </label>
          <input
            id="newsletter-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email của bạn"
            required
            type="email"
            value={email}
          />
          <button type="submit">Đăng ký</button>
        </form>
      </div>
    </section>
  );
}
