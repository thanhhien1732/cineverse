"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AgeRestrictionPolicy {
  readonly code: string;
  readonly title: string;
  readonly description: string;
}

const ageRestrictionPolicies: Readonly<Record<string, AgeRestrictionPolicy>> = {
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

const ratingAliases: Readonly<Record<string, string>> = {
  T13: "C13",
  T16: "C16",
};

interface AgeRestrictionModalProps {
  readonly open: boolean;
  readonly rating: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function AgeRestrictionModal({
  open,
  rating,
  onConfirm,
  onCancel,
}: AgeRestrictionModalProps) {
  const normalizedRating = ratingAliases[rating] ?? rating;
  const policy =
    ageRestrictionPolicies[normalizedRating] ?? ageRestrictionPolicies.P;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className={cn(
          "max-w-lg overflow-hidden border-white/15 bg-[#0a0f1a] p-0",
          "shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:max-w-lg",
        )}
        showCloseButton={false}
      >
        <DialogHeader className="gap-4 p-6 pb-4">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full border",
              "border-warning/50 bg-warning/10 text-lg font-black text-warning",
            )}
          >
            {policy.code}
          </span>
          <div className="grid gap-2">
            <DialogTitle className="text-xl font-black leading-tight">
              Xác nhận giới hạn độ tuổi
            </DialogTitle>
            <p className="font-bold text-warning">{policy.title}</p>
          </div>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {policy.description} Bạn xác nhận đã đọc và đáp ứng quy định phân
            loại độ tuổi trước khi chọn ghế.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="m-0 rounded-none border-white/10 bg-white/[0.02] px-6 py-4">
          <Button variant="outline" onClick={onCancel}>
            Chọn suất khác
          </Button>
          <Button onClick={onConfirm}>Tôi đã hiểu và đồng ý</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
