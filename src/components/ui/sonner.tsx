import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          success:
            "group-[.toaster]:!border-emerald-300 group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-950 dark:group-[.toaster]:!border-emerald-800 dark:group-[.toaster]:!bg-emerald-950 dark:group-[.toaster]:!text-emerald-100",
          error:
            "group-[.toaster]:!border-red-300 group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-950 dark:group-[.toaster]:!border-red-800 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!text-red-100",
          warning:
            "group-[.toaster]:!border-amber-300 group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-950 dark:group-[.toaster]:!border-amber-800 dark:group-[.toaster]:!bg-amber-950 dark:group-[.toaster]:!text-amber-100",
          info:
            "group-[.toaster]:!border-blue-300 group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-950 dark:group-[.toaster]:!border-blue-800 dark:group-[.toaster]:!bg-blue-950 dark:group-[.toaster]:!text-blue-100",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
