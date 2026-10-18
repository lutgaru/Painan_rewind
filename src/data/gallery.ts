import galleryData from "./gallery.json";

export interface GalleryMeta {
  title?: string;
  description?: string;
}

/**
 * Descripciones de la galería — edita `src/data/gallery.json`.
 * La clave es el nombre del archivo en `src/assets/gallery/` (con extensión).
 * Los campos vacíos ("") se ignoran y usan el valor por defecto.
 *
 * Ejemplo de entrada en el JSON:
 *   "14CC33.png": {
 *     "title": "Paso sobre el Golfo de México",
 *     "description": "Costa de Veracruz capturada a 500 km de altura."
 *   }
 */
export const galleryMeta = galleryData as Record<string, GalleryMeta>;

export const DEFAULT_DESCRIPTION =
  "Captura de la cámara de PAINANI-1 en espectro visible sobre territorio mexicano.";

/** Devuelve el título y la descripción finales para una foto. */
export function getGalleryMeta(file: string): { title: string; description: string } {
  const override = galleryMeta[file] ?? {};
  const title = override.title?.trim();
  const description = override.description?.trim();
  return {
    title: title || file.replace(/\.[^.]+$/, ""),
    description: description || DEFAULT_DESCRIPTION,
  };
}
