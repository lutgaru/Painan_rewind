import React, { useCallback, useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

export interface GallerySlide {
  file: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

interface Props {
  slides: GallerySlide[];
}

function ZoomIcon() {
  return (
    <svg
      className="gallery-zoom-badge"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.5a6.5 6.5 0 1 0 3.98 11.64l4.44 4.44a.9.9 0 1 0 1.27-1.27l-4.44-4.44A6.5 6.5 0 0 0 8 1.5Zm0 1.8a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Z"
        fill="currentColor"
      />
      <path d="M8 5.2a.9.9 0 0 1 .9.9v1.4h1.4a.9.9 0 0 1 0 1.8H8.9v1.4a.9.9 0 0 1-1.8 0V9.3H5.7a.9.9 0 0 1 0-1.8h1.4V6.1A.9.9 0 0 1 8 5.2Z" fill="currentColor" />
    </svg>
  );
}

export default function Gallery({ slides }: Props) {
  const [index, setIndex] = useState(-1);

  const open = useCallback((i: number) => setIndex(i), []);
  const close = useCallback(() => setIndex(-1), []);

  const isOpen = index >= 0;

  useEffect(() => {
    document.body.classList.toggle("lightbox-open", isOpen);
    return () => document.body.classList.remove("lightbox-open");
  }, [isOpen]);

  if (slides.length === 0) return null;

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
        {slides.map((slide, i) => (
          <figure
            key={slide.file}
            className="apple-card apple-card-interactive sat-photo reveal overflow-hidden"
            style={{ padding: 0, borderRadius: "var(--radius-l)", margin: 0 }}
          >
            <button
              type="button"
              className="gallery-tile"
              onClick={() => open(i)}
              aria-label={`Ampliar foto: ${slide.title}`}
            >
              <img
                src={slide.thumb}
                alt={slide.title}
                loading="lazy"
                decoding="async"
                className="w-full object-cover"
                style={{ aspectRatio: "4 / 3", display: "block" }}
              />
              <ZoomIcon />
            </button>
            <figcaption
              className="flex items-center justify-between"
              style={{ padding: "12px 16px", gap: 12 }}
            >
              <span
                className="sf-mono type-caption1 truncate"
                style={{ color: "var(--secondary-label)" }}
              >
                {slide.file}
              </span>
              <span
                className="sf-mono type-caption2"
                style={{ color: "var(--tertiary-label)", flexShrink: 0 }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <Lightbox
        open={isOpen}
        index={Math.max(index, 0)}
        close={close}
        slides={slides.map((slide) => ({
          src: slide.src,
          width: slide.width,
          height: slide.height,
          description: slide.description,
          alt: slide.title,
        }))}
        plugins={[Zoom, Captions, Thumbnails, Counter]}
        toolbar={{ buttons: ["close"] }}
        render={{ buttonZoom: () => null }}
        carousel={{ finite: false, padding: 0 }}
        controller={{ closeOnBackdropClick: true }}
        animation={{ fade: 250, swipe: 300 }}
        zoom={{ maxZoom: 5, scrollToZoom: true, doubleClickDelay: 300 }}
        captions={{ descriptionTextAlign: "center" }}
        thumbnails={{
          position: "bottom",
          width: 90,
          height: 60,
          gap: 8,
          border: 0,
          borderRadius: 8,
          padding: 4,
        }}
        counter={{ separator: " / " }}
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.94)" } }}
      />
    </div>
  );
}
