"use client";

import {
  CheckCircle2Icon,
  CircleAlertIcon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

export type FeedbackTone = "success" | "error" | "warning";

interface ToastMessage {
  readonly id: number;
  readonly message: string;
  readonly tone: FeedbackTone;
}

interface FeedbackContextValue {
  notify(message: string, tone?: FeedbackTone): void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function ToastIcon({ tone }: { readonly tone: FeedbackTone }) {
  if (tone === "error") {
    return <CircleAlertIcon aria-hidden="true" className="size-[1.125rem]" />;
  }

  if (tone === "warning") {
    return <InfoIcon aria-hidden="true" className="size-[1.125rem]" />;
  }

  return <CheckCircle2Icon aria-hidden="true" className="size-[1.125rem]" />;
}

export function FeedbackProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [toasts, setToasts] = useState<readonly ToastMessage[]>([]);
  const nextId = useRef(0);
  const timeoutIds = useRef<ReadonlyMap<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );

    const timeoutId = timeoutIds.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      const nextTimeoutIds = new Map(timeoutIds.current);
      nextTimeoutIds.delete(id);
      timeoutIds.current = nextTimeoutIds;
    }
  }, []);

  const notify = useCallback(
    (message: string, tone: FeedbackTone = "success") => {
      const id = nextId.current + 1;
      nextId.current = id;
      setToasts((currentToasts) => [
        ...currentToasts.filter((toast) => toast.id !== id),
        { id, message, tone },
      ]);

      const timeoutId = window.setTimeout(() => dismiss(id), 2800);
      const nextTimeoutIds = new Map(timeoutIds.current);
      nextTimeoutIds.set(id, timeoutId);
      timeoutIds.current = nextTimeoutIds;
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimeoutIds = timeoutIds.current;

    return () => {
      activeTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const contextValue = useMemo<FeedbackContextValue>(
    () => ({ notify }),
    [notify],
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="feedback-toast-stack"
      >
        {toasts.map((toast) => (
          <div
            className={`feedback-toast feedback-toast-${toast.tone}`}
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <ToastIcon tone={toast.tone} />
            <p>{toast.message}</p>
            <Button
              aria-label="Đóng thông báo"
              className="feedback-toast-dismiss"
              onClick={() => dismiss(toast.id)}
              size="icon-xs"
              variant="ghost"
            >
              <XIcon />
            </Button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const feedback = useContext(FeedbackContext);

  if (!feedback) {
    throw new Error("useFeedback must be used inside FeedbackProvider.");
  }

  return feedback;
}
