"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AppModalProps {
  readonly open: boolean;
  readonly title: string;
  /** Nhãn nhỏ in hoa nằm trên tiêu đề. */
  readonly eyebrow?: string;
  /** Huy hiệu/logo đặt bên trái phần tiêu đề. */
  readonly lead?: ReactNode;
  readonly description?: string;
  /** Mô tả có thể nằm trong thân modal thay vì dưới tiêu đề. */
  readonly descriptionPlacement?: "header" | "body";
  readonly children: ReactNode;
  /** Nội dung đứng trước cột chữ trong thân modal (ảnh, mã QR…). */
  readonly bodyLead?: ReactNode;
  /** Lớp phụ cho thân modal khi cần bố cục riêng. */
  readonly bodyClassName?: string;
  readonly footer?: ReactNode;
  readonly onOpenChange: (open: boolean) => void;
}

export function AppModal({
  open,
  title,
  eyebrow,
  lead,
  description,
  descriptionPlacement = "header",
  children,
  bodyLead,
  bodyClassName,
  footer,
  onOpenChange,
}: AppModalProps) {
  const renderedDescription = description ? (
    <DialogDescription className="app-modal-description">
      {description}
    </DialogDescription>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="app-modal gap-0 rounded-[1.25rem] p-0 sm:max-w-[40.625rem]"
        showCloseButton={false}
      >
        <DialogHeader className="app-modal-header flex-row items-center">
          {lead}
          <div className="app-modal-heading">
            {eyebrow && <p className="app-modal-eyebrow">{eyebrow}</p>}
            <DialogTitle className="app-modal-title text-[1.45rem] font-extrabold">
              {title}
            </DialogTitle>
            {descriptionPlacement === "header" && renderedDescription}
          </div>
        </DialogHeader>
        <div className={cn("app-modal-body", bodyClassName)}>
          {bodyLead}
          {descriptionPlacement === "body" ? (
            <div className="app-modal-body-copy">
              {renderedDescription}
              {children}
            </div>
          ) : (
            children
          )}
        </div>
        {footer && (
          <DialogFooter className="app-modal-footer mx-0 mb-0 rounded-b-[1.25rem] p-[1.125rem]">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
