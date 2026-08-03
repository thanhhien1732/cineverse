import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { HomeMovieCard } from "@/components/movies/home-movie-card";
import { HeroSwitcher } from "@/components/movies/hero-switcher";
import { NewsletterSignup } from "@/components/movies/newsletter-signup";
import { mockCatalogueRepository } from "@/services/mock-repositories";

const experienceItems = [
  {
    code: "IMAX",
    number: "01",
    title: "Khung hình cực đại",
    description: "Không gian màn ảnh mở rộng cho từng chi tiết điện ảnh.",
  },
  {
    code: "4DX",
    number: "02",
    title: "Chuyển động đa giác quan",
    description: "Hiệu ứng ghế, gió và rung chuyển đồng bộ với cảnh phim.",
  },
  {
    code: "ATMOS",
    number: "03",
    title: "Âm thanh vòm sống động",
    description: "Từng chuyển động âm thanh được định vị quanh khán phòng.",
  },
] as const;

export default async function HomePage() {
  const movies = await mockCatalogueRepository.findAllMovies();
  const nowShowing = movies.filter((movie) => movie.status === "now-showing");
  const comingSoon = movies.filter((movie) => movie.status === "coming-soon");
  const heroMovieIds = [
    "minions-monsters",
    "super-mario-galaxy",
    "disclosure-day",
    "the-odyssey",
    "forgotten-island",
  ];
  const featuredMovies = heroMovieIds.flatMap((id) => {
    const movie = movies.find((item) => item.id === id);

    return movie ? [movie] : [];
  });

  return (
    <>
      <HeroSwitcher movies={featuredMovies} />

      <section className="home-section" id="now-showing">
        <div className="home-container">
          <SectionHeading
            description="Những bộ phim nổi bật hiện có tại hệ thống rạp CINEVERSE."
            eyebrow="MÀN ẢNH LỚN"
            href="/movies?status=now-showing"
            linkLabel="Xem tất cả"
            title="Phim đang chiếu"
          />
          <div className="home-movie-grid">
            {nowShowing.slice(0, 4).map((movie) => (
              <HomeMovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-dark" id="coming-soon">
        <div className="home-container">
          <SectionHeading
            description="Khám phá trước các tác phẩm đang chờ ngày công chiếu."
            eyebrow="SẮP RA MẮT"
            href="/movies?status=coming-soon"
            linkLabel="Xem lịch chiếu"
            title="Phim sắp chiếu"
          />
          <div className="home-movie-grid">
            {comingSoon.slice(0, 4).map((movie) => (
              <HomeMovieCard compact key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      <section className="experience-section home-section" id="experience">
        <div className="home-container">
          <SectionHeading
            description="Định dạng trình chiếu hiện đại biến mỗi suất chiếu thành một hành trình đa giác quan."
            eyebrow="TRẢI NGHIỆM CINEVERSE"
            title="Không chỉ là một bộ phim"
          />
          <div className="experience-grid">
            {experienceItems.map((item) => (
              <article className="experience-card" key={item.code}>
                <span>{item.number}</span>
                <h3>{item.code}</h3>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSignup />
    </>
  );
}

function SectionHeading({
  description,
  eyebrow,
  href,
  linkLabel,
  title,
}: {
  readonly description: string;
  readonly eyebrow: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly title: string;
}) {
  return (
    <div className="home-section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {href && linkLabel ? (
        <Link className="home-text-link" href={href}>
          {linkLabel}
          <ArrowRightIcon aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
