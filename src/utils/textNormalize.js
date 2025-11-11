// Utilidad para normalizar texto y realizar coincidencias flexibles sin acentos
// Convierte a minúsculas, elimina diacríticos y recorta espacios
export function normalizeText(input) {
  if (input == null) return '';
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Verifica si el texto (normalizado) contiene el término (normalizado)
export function includesNormalized(text, term) {
  const a = normalizeText(text);
  const b = normalizeText(term);
  if (!b) return true;
  return a.includes(b);
}

// Verifica si alguna palabra del texto (normalizado) empieza con el término (normalizado)
export function anyWordStartsWith(text, term) {
  const a = normalizeText(text);
  const b = normalizeText(term);
  if (!b) return true;
  return a.split(/\s+/).some((w) => w.startsWith(b));
}