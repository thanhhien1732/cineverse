import type { Combo } from "@/types/domain";
import type { ComboRepository } from "@/types/repositories";

const combos: readonly Combo[] = [
  { id: "classic-duo", name: "Classic Duo", description: "01 bắp rang bơ lớn + 02 nước ngọt vừa", unitPrice: 149000, imagePath: "/assets/combos/classic-duo.svg", badge: "Bán chạy" },
  { id: "galaxy-box", name: "Galaxy Box", description: "01 bắp rang bơ lớn + 01 nachos + 02 nước ngọt lớn", unitPrice: 219000, imagePath: "/assets/combos/galaxy-box.svg", badge: "Tiết kiệm 12%" },
  { id: "star-snack", name: "Star Snack", description: "01 hot dog + 01 nước ngọt vừa", unitPrice: 99000, imagePath: "/assets/combos/star-snack.svg", badge: "Đồ ăn nhẹ" },
  { id: "kids-orbit", name: "Kids Orbit", description: "01 bắp rang bơ nhỏ + 01 nước trái cây + 01 mô hình mini", unitPrice: 129000, imagePath: "/assets/combos/kids-orbit.svg", badge: "Dành cho bé" },
];

export const mockComboRepository: ComboRepository = { async findAllCombos() { return combos; } };
