import Image from "next/image";
import { CampaignPlaceholder } from "@/components/campaigns/campaign-placeholder";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Resolve a public storage path to a full URL, or null for placeholders. */
export function campaignImageUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  try {
    const { url } = getSupabasePublicEnv();
    return `${url}/storage/v1/object/public/campaign-images/${storagePath}`;
  } catch {
    return null;
  }
}

export function CampaignImage({
  storagePath,
  alt,
  seed,
  sizes,
  priority = false,
}: {
  storagePath: string | null;
  alt: string;
  seed: string;
  sizes?: string;
  priority?: boolean;
}) {
  const src = campaignImageUrl(storagePath);
  if (!src) {
    return <CampaignPlaceholder seed={seed} label={alt} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
      priority={priority}
      className="object-cover"
    />
  );
}
