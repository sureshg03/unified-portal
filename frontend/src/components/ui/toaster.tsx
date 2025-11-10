import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

type ToastVariant = "default" | "destructive" | "success";

export function Toaster() {
  const { toasts } = useToast();

  const getVariant = (variant: ToastVariant | undefined, title: string): ToastVariant => {
    const titleStr = title || "";
    const titleLower = titleStr.toLowerCase();
    
    // Check if title contains success indicators
    if (titleLower.includes("success") || titleLower.includes("successful") || titleStr.includes("✅")) {
      return "success";
    }
    
    // Check if title contains error/warning indicators
    if (variant === "destructive" || titleLower.includes("failed") || titleLower.includes("error") || titleStr.includes("❌") || titleStr.includes("⚠️")) {
      return "destructive";
    }
    
    // Default
    return variant ?? "default";
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const actualVariant = getVariant(variant as ToastVariant | undefined, title || "");
        
        return (
          <Toast key={id} variant={actualVariant} {...props}>
            <div className="grid gap-1.5 w-full">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
