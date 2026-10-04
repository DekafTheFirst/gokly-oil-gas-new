/**
 * Contract tests for the multipart course submission builder.
 *
 * Regression guard: `buildCourseFormData` must never mutate the wizard state it
 * is handed. It used to delete the `file` handle and add a `fileKey` in place,
 * which stripped the File from React state without ever replacing it with the
 * uploaded URL — so freshly uploaded materials stayed stuck on "uploads when
 * saved" until the page was manually refreshed.
 */
import { describe, expect, it } from "vitest";

import { buildCourseFormData, THUMBNAIL_FIELD } from "@/lib/materials";
import type { CourseModule } from "@/lib/courses";

const makeFile = (name: string, type: string) =>
  new File(["PDF-BYTES"], name, { type });

const modulesWith = (materials: Array<Record<string, unknown>>) =>
  [{ name: "Module One", sort_order: 0, materials }] as unknown as CourseModule[];

describe("buildCourseFormData", () => {
  it("does not mutate the modules it is given", () => {
    const file = makeFile("deck.pdf", "application/pdf");
    const modules = modulesWith([
      { name: "deck.pdf", size: 9, type: "application/pdf", file },
    ]);

    buildCourseFormData({ title: "Course" }, { modules });

    // The original objects must be untouched: File still attached, no fileKey.
    const original = (modules[0] as unknown as { materials: Array<Record<string, unknown>> })
      .materials[0];
    expect(original.file).toBe(file);
    expect(original.fileKey).toBeUndefined();
  });

  it("keeps the File in state and only strips it from the payload copy", () => {
    const file = makeFile("deck.pdf", "application/pdf");
    const modules = modulesWith([
      { name: "deck.pdf", size: 9, type: "application/pdf", file },
    ]);

    const form = buildCourseFormData({ title: "Course" }, { modules });
    const payload = JSON.parse(form.get("payload") as string);

    expect(payload.modules[0].materials[0].fileKey).toBe("m0");
    expect(payload.modules[0].materials[0].file).toBeUndefined();
    // and the caller's copy still has it
    const original = (modules[0] as unknown as { materials: Array<Record<string, unknown>> })
      .materials[0];
    expect(original.file).toBe(file);
  });

  it("never re-uploads a material that is already stored", () => {
    const modules = modulesWith([
      { name: "stored.pdf", url: "https://res.cloudinary.com/x/raw/a.pdf", publicId: "x/a" },
    ]);

    const form = buildCourseFormData({ title: "Course" }, { modules });

    expect(form.has("m0")).toBe(false);
    const payload = JSON.parse(form.get("payload") as string);
    expect(payload.modules[0].materials[0].url).toBe("https://res.cloudinary.com/x/raw/a.pdf");
  });

  it("sends the thumbnail under its own field", () => {
    const thumb = makeFile("cover.png", "image/png");
    const form = buildCourseFormData({ title: "Course" }, {
      modules: [],
      thumbnailFile: thumb,
    });

    expect(form.get(THUMBNAIL_FIELD)).toBeTruthy();
    expect(form.get("payload")).toBeTruthy();
  });

  it("keeps stored materials alongside newly picked ones", () => {
    const file = makeFile("new.pdf", "application/pdf");
    const modules = modulesWith([
      { name: "stored.pdf", url: "https://res.cloudinary.com/x/raw/a.pdf", publicId: "x/a" },
      { name: "new.pdf", size: 9, type: "application/pdf", file },
    ]);

    const form = buildCourseFormData({ title: "Course" }, { modules });

    // Only the new one gets a file part, keyed m0.
    expect(form.has("m0")).toBe(true);
    expect(form.has("m1")).toBe(false);
    const payload = JSON.parse(form.get("payload") as string);
    expect(payload.modules[0].materials).toHaveLength(2);
    expect(payload.modules[0].materials[0].fileKey).toBeUndefined();
    expect(payload.modules[0].materials[1].fileKey).toBe("m0");
  });
});