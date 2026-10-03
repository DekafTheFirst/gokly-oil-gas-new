import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CourseUploadReport, MaterialUploadFailure } from "@/lib/materials";

/** How long the success screen lingers before auto-continuing. */
export const SUCCESS_REDIRECT_MS = 3500;

interface CourseSaveSuccessProps {
  heading: string;
  courseTitle?: string;
  courseCode?: string;
  /** Present when the save travelled as one multipart submission. */
  uploads?: CourseUploadReport;
  redirectNote: string;
  redirectMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

/** Amber list of the files that did not make it, plus how to recover. */
function UploadFailures({ failed }: { failed: MaterialUploadFailure[] }) {
  return (
    <ul className="space-y-1.5 rounded-xl bg-amber-50/60 p-3 ring-1 ring-inset ring-amber-600/10">
      {failed.map((item) => (
        <li key={`${item.field}-${item.name}`} className="flex items-start gap-2 text-xs">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="min-w-0">
            <span className="font-medium text-slate-800">{item.name}</span>
            <span className="text-slate-500"> — {item.error}</span>
          </span>
        </li>
      ))}
      <li className="pt-0.5 text-[11px] leading-relaxed text-slate-500">
        The course was saved without {failed.length === 1 ? "this file" : "these files"}. Edit the
        course to upload {failed.length === 1 ? "it" : "them"} again.
      </li>
    </ul>
  );
}

/** Success state shown after a course is created or updated.
 *
 * Deliberately more than a "thanks" line: it confirms *what* was stored, calls
 * out any file that failed to upload (the course still saves; the user can
 * re-upload via edit), and offers an explicit action rather than forcing a
 * timed redirect.
 */
export function CourseSaveSuccess({
  heading,
  courseTitle,
  courseCode,
  uploads,
  redirectNote,
  redirectMs = SUCCESS_REDIRECT_MS,
  actionLabel,
  onAction,
}: CourseSaveSuccessProps) {
  const failed = uploads?.failed ?? [];
  const succeeded = uploads?.succeeded ?? [];
  const showUploads = Boolean(uploads && (failed.length > 0 || succeeded.length > 0));

  return (
    <div className="flex min-h-[520px] items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        role="status"
        aria-live="polite"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="px-8 pb-6 pt-9 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-600/20"
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </motion.div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{heading}</h2>

          {courseTitle ? (
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              {courseTitle}
            </p>
          ) : null}

          {courseCode ? (
            <span className="mt-3 inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              {courseCode}
            </span>
          ) : null}
        </div>

        {showUploads ? (
          <div className="border-t border-slate-100 px-8 py-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                File uploads
              </span>
              <span className="flex items-center gap-2 text-xs">
                {succeeded.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <CheckCircle2 className="h-3 w-3" />
                    {succeeded.length} uploaded
                  </span>
                ) : null}
                {failed.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                    <AlertTriangle className="h-3 w-3" />
                    {failed.length} failed
                  </span>
                ) : null}
              </span>
            </div>

            {failed.length > 0 ? (
              <UploadFailures failed={failed} />
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                All files stored successfully.
              </p>
            )}
          </div>
        ) : null}

        <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-5">
          <div className="mb-3 flex items-center justify-center gap-2">
            {onAction && actionLabel ? (
              <Button type="button" onClick={onAction} className="h-9">
                {actionLabel}
              </Button>
            ) : null}
          </div>
          <p className="text-center text-[11px] text-slate-500">{redirectNote}</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: redirectMs / 1000, ease: "linear" }}
              className="h-full w-full origin-left bg-emerald-500"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}