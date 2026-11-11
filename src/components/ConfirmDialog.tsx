import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Rose styling + warning icon for destructive/irreversible actions. */
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Controlled confirmation modal built on the project's AlertDialog.
 * Use for programmatic confirmations (e.g. intercepting navigation away
 * from unsaved work) where an AlertDialogTrigger isn't a good fit.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                destructive ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600",
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-1.5 leading-relaxed">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600"
                : undefined
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
