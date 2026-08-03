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

interface AppModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly onOpenChange: (open: boolean) => void;
}

export function AppModal({
  open,
  title,
  description,
  children,
  footer,
  onOpenChange,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-modal" showCloseButton={false}>
        <DialogHeader className="app-modal-header">
          <DialogTitle className="app-modal-title">{title}</DialogTitle>
          {description && (
            <DialogDescription className="app-modal-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="app-modal-body">{children}</div>
        {footer && (
          <DialogFooter className="app-modal-footer">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
