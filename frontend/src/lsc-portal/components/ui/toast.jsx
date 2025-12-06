import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<>,
  React.ComponentPropsWithoutRef<>
>(({ className, ...props }, ref) => (
  <>
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border-2 p-6 pr-10 shadow-lg backdrop-blur-xl transition-all data-[swipe=cancel]-x-0 data-[swipe=end]-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]-none data-[state=open]-in data-[state=closed]-out data-[swipe=end]-out data-[state=closed]-out-80 data-[state=closed]-out-to-right-full data-[state=open]-in-from-top-full",
  {
    variants: {
      variant: {
        default: "border-indigo-400/60 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white",
        destructive: "destructive group border-red-400/60 bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 text-white",
        success: "border-emerald-400/60 bg-gradient-to-br from-green-700 via-green-600 to-green-700 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<>,
  React.ComponentPropsWithoutRef<> & VariantProps<>
>(({ className, variant, ...props }, ref) => {
  return <>;
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<>,
  React.ComponentPropsWithoutRef<>
>(({ className, ...props }, ref) => (
  <>
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<>,
  React.ComponentPropsWithoutRef<>
>(({ className, ...props }, ref) => (
  <>
    <>
  <>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<>,
  React.ComponentPropsWithoutRef<>
>(({ className, ...props }, ref) => (
  <>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<>,
  React.ComponentPropsWithoutRef<>
>(({ className, ...props }, ref) => (
  <>
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<>;

type ToastActionElement = React.ReactElement<>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};



