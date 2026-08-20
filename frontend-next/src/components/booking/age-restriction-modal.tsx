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
import { ageRestrictionPolicies, ratingAliases } from "@/lib/age-rating";
import { cn } from "@/lib/utils";

export {
  ageRestrictionPolicies,
  ratingAliases,
  resolveRatingCode,
  resolveRatingPolicy,
  type AgeRestrictionPolicy,
} from "@/lib/age-rating";

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
          "max-w-lg overflow-hidden border-white/15 bg-surface p-0",
          "shadow-2xl sm:max-w-lg",
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
        <DialogFooter className="m-0 rounded-none border-white/10 bg-white/2 px-6 py-4">
          <Button variant="outline" onClick={onCancel}>
            Chọn suất khác
          </Button>
          <Button onClick={onConfirm}>Tôi đã hiểu và đồng ý</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
