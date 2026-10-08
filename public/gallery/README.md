# Carpeta para fotos SAT de PAINANI-1

Coloca las fotos tomadas desde el satélite (JPG/PNG/WEBP) en `src/assets/gallery/`.

`Gallery.astro` las detecta con un glob en tiempo de compilación y las optimiza
con el componente `Image` de Astro (tamaños responsivos + salida WebP).

`public/gallery/` ya no alimenta la galería; se conserva solo para archivos
estáticos que quieras referenciar manualmente en `/gallery/...`.

El favicon vive en `public/painani1.png` (los navegadores lo piden como archivo
estático); el logo del navbar usa la copia optimizada en `src/assets/painani1.png`.
