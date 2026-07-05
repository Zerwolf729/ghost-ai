"use client";

import { useCallback, useState } from "react";
import { ToastAction } from "@/components/ui/toast";

// Toast types
type ToastVariant = "default" | "destructive" | "success";

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast context - simple implementation without full provider pattern
let toastId = 0;
const toasts: ToastData[] = [];

export function useToast() {
  const [toastState, setToastState] = useState<ToastData[]>([]);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
      action,
    }: Omit<ToastData, "id">) => {
      const id = String(++toastId);
      const newToast: ToastData = {
        id,
        title,
        description,
        variant,
        action,
      };
      toasts.push(newToast);
      setToastState([...toasts]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        const index = toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
          toasts.splice(index, 1);
          setToastState([...toasts]);
        }
      }, 4000);

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
      setToastState([...toasts]);
    }
  }, []);

  return { toast, dismiss, toasts: toastState };
}
