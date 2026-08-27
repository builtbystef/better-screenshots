import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// The registry ships this reading the scheme from next-themes. This app has no
// theme store — `schemeBootScript` mirrors `prefers-color-scheme` onto `.dark`
// — and Sonner's own "system" resolves against that same media query, so the
// dependency buys nothing here.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      // Sonner injects `[data-sonner-toaster] { font-family: ... }` at runtime,
      // which ties `.font-sans` on specificity and wins on source order, so the
      // app face needs the important flag to reach the toast.
      className="toaster group font-sans!"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
