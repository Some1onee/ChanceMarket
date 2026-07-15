"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CampaignPlaceholder } from "@/components/campaigns/campaign-placeholder";
import { cn } from "@/lib/utils";

type GalleryImage = { url: string | null; alt: string };

export function CampaignGallery({
  images,
  seed,
  title,
}: {
  images: GalleryImage[];
  seed: string;
  title: string;
}) {
  const usable = images.length > 0 ? images : [{ url: null, alt: title }];
  const [active, setActive] = React.useState(0);
  const current = usable[Math.min(active, usable.length - 1)] ?? usable[0]!;

  return (
    <div className="space-y-3">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="Zoom image"
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {current.url ? (
              <Image
                src={current.url}
                alt={current.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <CampaignPlaceholder seed={seed} label={title} />
            )}
            <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-4" aria-hidden />
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">{current.alt}</DialogTitle>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            {current.url ? (
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            ) : (
              <CampaignPlaceholder seed={seed} label={title} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {usable.length > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Gallery thumbnails"
        >
          {usable.map((image, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Image ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                index === active ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              {image.url ? (
                <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <CampaignPlaceholder seed={`${seed}-${index}`} />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
