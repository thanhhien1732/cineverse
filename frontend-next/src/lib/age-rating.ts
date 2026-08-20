/** Bảng phân loại độ tuổi của Cục Điện ảnh, dùng chung cho cả server và client. */
export interface AgeRestrictionPolicy {
  readonly code: string;
  readonly title: string;
  readonly description: string;
}

export const ageRestrictionPolicies: Readonly<
  Record<string, AgeRestrictionPolicy>
> = {
  P: {
    code: "P",
    title: "Phổ biến cho mọi độ tuổi",
    description:
      "Phim được phép phổ biến đến người xem ở mọi độ tuổi. Trẻ em nên có người lớn đi cùng.",
  },
  K: {
    code: "K",
    title: "Khán giả dưới 13 tuổi cần người giám hộ",
    description:
      "Người xem dưới 13 tuổi chỉ được xem phim khi có cha, mẹ hoặc người giám hộ đi cùng.",
  },
  C13: {
    code: "C13",
    title: "Chỉ dành cho khán giả từ đủ 13 tuổi",
    description:
      "Khán giả dưới 13 tuổi không được phép xem phim này. Nhân viên có thể yêu cầu giấy tờ xác minh độ tuổi.",
  },
  C16: {
    code: "C16",
    title: "Chỉ dành cho khán giả từ đủ 16 tuổi",
    description:
      "Khán giả dưới 16 tuổi không được phép xem phim này. Nhân viên có thể yêu cầu giấy tờ xác minh độ tuổi.",
  },
  T18: {
    code: "T18",
    title: "Chỉ dành cho khán giả từ đủ 18 tuổi",
    description:
      "Khán giả dưới 18 tuổi không được phép xem phim này. Vui lòng mang giấy tờ tùy thân khi đến rạp.",
  },
};

export const ratingAliases: Readonly<Record<string, string>> = {
  T13: "C13",
  T16: "C16",
};

/** Nhãn phân loại trong dữ liệu phim → mã hiển thị (`T13` → `C13`). */
export function resolveRatingCode(ratingLabel: string): string {
  const normalized = ratingAliases[ratingLabel] ?? ratingLabel;

  return ageRestrictionPolicies[normalized]?.code ?? normalized;
}

/** Chính sách tương ứng với nhãn phân loại, mặc định về `P` nếu không khớp. */
export function resolveRatingPolicy(ratingLabel: string): AgeRestrictionPolicy {
  return (
    ageRestrictionPolicies[ratingAliases[ratingLabel] ?? ratingLabel] ??
    ageRestrictionPolicies.P
  );
}
