/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to slugify
 * @returns {string} - URL-friendly slug
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Generate a unique slug for a book
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @param {string} existingSlug - Existing slug if updating
 * @returns {string} - Unique slug
 */
export function generateBookSlug(title, author, existingSlug = null) {
  if (existingSlug) return existingSlug; // Don't change existing slugs
  
  const baseSlug = slugify(title);
  const authorSlug = slugify(author);
  
  // Combine title and author for uniqueness
  return `${baseSlug}-${authorSlug}`;
}
