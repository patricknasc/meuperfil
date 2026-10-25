"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name, radius }: { images: Array<{ url: string; alt: string | null }>; name: string; radius: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return (
      <div className={`flex aspect-square w-full items-center justify-center bg-black/5 text-6xl font-black opacity-40 ${radius}`}>
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`relative aspect-square w-full overflow-hidden bg-black/5 ${radius}`}>
        <Image unoptimized fill priority sizes="(min-width: 768px) 50vw, 100vw" src={current.url} alt={current.alt || name} className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${index + 1} / ${images.length}`}
              aria-current={index === active}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === active ? "border-current" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image unoptimized fill sizes="64px" src={image.url} alt="" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
