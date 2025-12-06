import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

type ToastVariant = "default" | "destructive" | "success";

export function Toaster() {
  const { toasts } = useToast();

  const getVariant = (variant, title) => {
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
    <>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const actualVariant = getVariant(variant as ToastVariant | undefined, title || "");
        
        return (
          <>
            <>
              {title && <>{title}<>}
              {description && <>{description}<>}
            <>
            {action}
            <>
          <>
        );
      })}
      <>
    <>
  );
}



