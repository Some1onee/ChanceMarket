"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { campaignImageUrl } from "@/components/campaigns/campaign-image";
import {
  deleteCampaignImageAction,
  registerCampaignImageAction,
  updateCampaignImagesAction,
} from "@/features/campaigns/wizard-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export type WizardImage = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export function ImageUploader({
  campaignId,
  userId,
  initialImages,
}: {
  campaignId: string;
  userId: string;
  initialImages: WizardImage[];
}) {
  const [images, setImages] = React.useState<WizardImage[]>(
    [...initialImages].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function persistOrder(next: WizardImage[]) {
    setImages(next);
    const result = await updateCampaignImagesAction(
      campaignId,
      next.map((image, index) => ({
        id: image.id,
        sortOrder: index,
        isCover: image.is_cover,
        altText: image.alt_text ?? "",
      })),
    );
    if (!result.ok) toast.error(result.message);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = getSupabaseBrowserClient();

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPEG, PNG, WEBP or AVIF images are accepted.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: images must be under 8 MB.`);
        continue;
      }
      const ext = file.type.split("/")[1] ?? "jpg";
      const path = `${userId}/${campaignId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("campaign-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        toast.error(`${file.name}: upload failed — ${uploadError.message}`);
        continue;
      }
      const result = await registerCampaignImageAction(campaignId, {
        storagePath: path,
        altText: "",
        isCover: images.length === 0,
        sortOrder: images.length,
      });
      if (!result.ok) {
        toast.error(result.message);
        continue;
      }
      setImages((current) => [
        ...current,
        {
          id: result.data.id,
          storage_path: path,
          alt_text: "",
          sort_order: current.length,
          is_cover: current.length === 0,
        },
      ]);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(image: WizardImage) {
    const result = await deleteCampaignImageAction(campaignId, image.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setImages((current) => current.filter((item) => item.id !== image.id));
  }

  function move(index: number, delta: -1 | 1) {
    const next = [...images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    void persistOrder(next);
  }

  function setCover(id: string) {
    void persistOrder(images.map((image) => ({ ...image, is_cover: image.id === id })));
  }

  function setAlt(id: string, alt: string) {
    setImages((current) =>
      current.map((image) => (image.id === id ? { ...image, alt_text: alt } : image)),
    );
  }

  async function saveAlts() {
    await persistOrder(images);
    toast.success("Image details saved");
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="image-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-subtle px-6 py-10 text-center transition-colors hover:border-primary"
      >
        {uploading ? (
          <Spinner label="Uploading…" />
        ) : (
          <>
            <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Add photos of the prize</span>
            <span className="text-xs text-muted-foreground">
              JPEG, PNG, WEBP or AVIF · max 8 MB each · first image becomes the cover
            </span>
          </>
        )}
        <input
          id="image-upload"
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </label>

      {images.length > 0 ? (
        <>
          <ul className="space-y-3">
            {images.map((image, index) => (
              <li
                key={image.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {campaignImageUrl(image.storage_path) ? (
                    <Image
                      src={campaignImageUrl(image.storage_path)!}
                      alt={image.alt_text ?? ""}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Input
                    aria-label={`Alt text for image ${index + 1}`}
                    placeholder="Describe this photo (alt text)"
                    value={image.alt_text ?? ""}
                    onChange={(event) => setAlt(image.id, event.target.value)}
                    onBlur={() => void saveAlts()}
                    className="h-8 text-xs"
                  />
                  {image.is_cover ? (
                    <span className="text-xs font-medium text-accent">Cover image</span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Set as cover"
                    onClick={() => setCover(image.id)}
                    disabled={image.is_cover}
                  >
                    <Star aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete image" onClick={() => void remove(image)}>
                    <Trash2 className="text-destructive" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
