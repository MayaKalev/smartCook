// src/utils/fetchImage.js

const UNSPLASH_KEY = "fR9PvCFHbpR0Z7ep-TQ19kUmjDK-x8rg6dGqBZsc6N8";
const PIXABAY_KEY = "50855726-e660c5f97456d8f1b080300f3"; // החלף את זה למפתח שקיבלת מפיקסאביי
const cache = {};

/**
 * מחפש תמונה מתאימה למתכון מתוך Unsplash ואחריו Pixabay.
 * אם לא מוצא - מחזיר null.
 */
export async function fetchImage(query) {
  if (cache[query]) return cache[query];

  const simplified = simplifyQuery(query);

  const image =
    (await tryUnsplash(simplified)) ||
    (await tryPixabay(simplified)) ||
    null;

  cache[query] = image;
  return image;
}

/**
 * מפשט את מונח החיפוש על ידי הוספת מילת מפתח שקשורה לאוכל
 */
function simplifyQuery(q) {
  const keywords = ["recipe", "dish", "meal", "vegetarian", "vegan"];
  return `${q} ${keywords[Math.floor(Math.random() * keywords.length)]}`;
}

/**
 * חיפוש ב־Unsplash ומיון לפי האם זה קשור לאוכל
 */
async function tryUnsplash(q) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&client_id=${UNSPLASH_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    const valid = data.results?.find((img) => {
      const text = `${img.alt_description || ""} ${img.description || ""} ${img.tags?.map(t => t.title).join(" ")}`;
      return /food|dish|meal|cooking|plate|vegan|vegetarian/i.test(text);
    });

    return valid?.urls?.regular || null;
  } catch (err) {
    console.warn("Unsplash error:", err);
    return null;
  }
}

/**
 * חיפוש ב־Pixabay בתמונות מסוג צילום מקטגוריית אוכל
 */
async function tryPixabay(q) {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=5&category=food`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    const valid = data.hits?.find((hit) =>
      hit.tags?.toLowerCase().includes("food") || true
    );

    return valid?.webformatURL || null;
  } catch (err) {
    console.warn("Pixabay error:", err);
    return null;
  }
}
