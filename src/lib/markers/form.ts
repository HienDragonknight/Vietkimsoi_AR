import {
  markerUploadDir,
  publicUrlFromUpload,
  saveUploadedFile,
} from "./store";
import type { ArticleSection, MarkerImageVariant, MarkerVariants } from "./types";
import { VARIANT_KEYS, VARIANT_LABELS, type VariantKey } from "./variants";

export function pathExt(filename: string, fallback: string): string {
  const ext = filename.includes(".")
    ? `.${filename.split(".").pop()}`
    : fallback;
  return ext.toLowerCase();
}

export async function saveVariantFiles(
  form: FormData,
  dir: string,
  existing?: MarkerVariants
): Promise<MarkerVariants> {
  const result: Partial<MarkerVariants> = {};

  for (const key of VARIANT_KEYS) {
    const sourceFile = form.get(`variant_${key}`);
    const previewFile = form.get(`variantPreview_${key}`);
    const prev = existing?.[key];

    let sourceImage = prev?.sourceImage ?? "";
    let previewImage = prev?.previewImage ?? sourceImage;

    if (sourceFile instanceof File && sourceFile.size > 0) {
      const ext = pathExt(sourceFile.name, ".jpg");
      sourceImage = publicUrlFromUpload(
        await saveUploadedFile(sourceFile, `${dir}/${key}-source${ext}`)
      );
      previewImage = sourceImage;
    }

    if (previewFile instanceof File && previewFile.size > 0) {
      const ext = pathExt(previewFile.name, ".jpg");
      previewImage = publicUrlFromUpload(
        await saveUploadedFile(previewFile, `${dir}/${key}-preview${ext}`)
      );
    }

    if (!sourceImage) {
      throw new Error(`Thiếu ảnh marker: ${VARIANT_LABELS[key]}.`);
    }

    result[key] = {
      label: VARIANT_LABELS[key],
      sourceImage,
      previewImage: previewImage || sourceImage,
    } satisfies MarkerImageVariant;
  }

  return result as MarkerVariants;
}

export async function mergeSectionImages(
  form: FormData,
  sections: ArticleSection[],
  dir: string,
  existingSections: ArticleSection[] = []
): Promise<ArticleSection[]> {
  const merged = sections.map((section, index) => ({
    ...section,
    image: section.image ?? existingSections[index]?.image,
  }));

  for (let i = 0; i < merged.length; i++) {
    const file = form.get(`sectionImage_${i}`);
    if (file instanceof File && file.size > 0) {
      const ext = pathExt(file.name, ".jpg");
      merged[i].image = publicUrlFromUpload(
        await saveUploadedFile(file, `${dir}/section-${i}${ext}`)
      );
    }
  }

  return merged;
}

export function getVariantFormField(key: VariantKey): string {
  return `variant_${key}`;
}
