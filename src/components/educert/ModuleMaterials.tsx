import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

export interface ModuleMaterial {
  name: string;
  size?: number | null;
  type?: string | null;
  url?: string | null;
  publicId?: string | null;
  resourceType?: string | null;
  /** Present only for a file picked in the current wizard session. */
  file?: File | null;
  [key: string]: unknown;
}

const formatSize = (bytes?: number | null): string => {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const iconFor = (material: ModuleMaterial) => {
  const type = (material.type || "").toLowerCase();
  const name = (material.name || "").toLowerCase();
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/") || /\.(mp4|mov|webm)$/.test(name)) return Film;
  if (type.includes("sheet") || /\.(xlsx?|csv)$/.test(name)) return FileSpreadsheet;
  return FileText;
};

/** Cloudinary delivery URL for a stored material, if it has one. */
const materialUrl = (material?: ModuleMaterial | null): string | null =>
  material?.url || null;

interface ModuleMaterialsProps {
  materials?: ModuleMaterial[] | null;
  /** Called with the material's index when the row is removed. */
  onRemove?: (index: number) => void;
  emptyHint?: string;
}

/**
 * List of a module's training materials.
 *
 * A stored material (it has a Cloudinary `url`) renders as a link — clicking
 * opens the file in a new tab, so PDFs and Office documents are previewed in
 * the browser and unsupported types simply download. A material still awaiting
 * upload has no URL yet and is shown as pending rather than as a dead link.
 */
export function ModuleMaterials({ materials, onRemove, emptyHint }: ModuleMaterialsProps) {
  const list = Array.isArray(materials) ? materials : [];

  if (list.length === 0) {
    return emptyHint ? (
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <FileText className="h-3.5 w-3.5" />
        {emptyHint}
      </p>
    ) : null;
  }

  return (
    <ul className="flex flex-col gap-2">
      {list.map((material, index) => {
        const Icon = iconFor(material);
        const href = materialUrl(material);
        const pending = !href;

        return (
          <li
            key={material.publicId || `${material.name}-${index}`}
            className="flex flex-col gap-2 rounded-lg bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex min-w-0 flex-col">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${material.name}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-emerald-600 hover:underline"
                  >
                    <span className="truncate">{material.name}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                    {material.name}
                    <Upload className="h-3 w-3 shrink-0 text-amber-500" />
                    <span className="text-[11px] font-medium text-amber-600">Uploads when saved</span>
                  </span>
                )}

                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <span>{formatSize(material.size)}</span>
                  <span>•</span>
                  <span className="font-medium text-emerald-600">Trainee Visible</span>
                </div>
              </div>
            </div>

            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${material.name}`}
                className="self-end rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 sm:self-auto"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                </svg>
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default ModuleMaterials;