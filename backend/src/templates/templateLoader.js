/**
 * Trusted Template Loader & Registry
 * 
 * Dynamically loads and validates templates from /src/templates/*.json.
 * Frontend cannot inject custom schemas; server relies strictly on these trusted JSONs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for fast lookup
let templatesCache = null;
let lastLoadedTime = 0;
const CACHE_TTL_MS = 10000; // 10s auto-refresh during dev

/**
 * Loads all template JSON files from directory
 * @returns {Array<Object>} list of template definitions
 */
export function getAllTemplateDefinitions() {
  const now = Date.now();
  if (templatesCache && (now - lastLoadedTime < CACHE_TTL_MS)) {
    return templatesCache;
  }

  try {
    const files = fs.readdirSync(__dirname);
    const loaded = [];

    for (const file of files) {
      if (file.startsWith('template-') && file.endsWith('.json')) {
        const fullPath = path.join(__dirname, file);
        const rawContent = fs.readFileSync(fullPath, 'utf-8');
        try {
          const parsed = JSON.parse(rawContent);
          if (parsed.templateId) {
            loaded.push(parsed);
          }
        } catch (parseErr) {
          console.error(`✕ Failed to parse template file: ${file}`, parseErr.message);
        }
      }
    }

    // Sort cleanly by templateId
    loaded.sort((a, b) => a.templateId.localeCompare(b.templateId, undefined, { numeric: true }));

    templatesCache = loaded;
    lastLoadedTime = now;
    return templatesCache;
  } catch (err) {
    console.error('✕ Failed to read templates directory:', err.message);
    return templatesCache || [];
  }
}

/**
 * Retrieves a specific template by its ID
 * @param {string} templateId 
 * @returns {Object|null}
 */
export function getTemplateDefinitionById(templateId) {
  if (!templateId) return null;
  const all = getAllTemplateDefinitions();
  const targetId = String(templateId).trim().toLowerCase();
  return all.find(t => t.templateId.toLowerCase() === targetId) || null;
}

/**
 * Validates if template ID exists in trusted registry
 * @param {string} templateId 
 * @returns {boolean}
 */
export function isValidTemplateId(templateId) {
  return Boolean(getTemplateDefinitionById(templateId));
}

export default {
  getAllTemplateDefinitions,
  getTemplateDefinitionById,
  isValidTemplateId
};
