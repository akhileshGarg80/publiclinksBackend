/**
 * Template Engine & Registry
 * Dispatches profile data to appropriate modular template renderers
 */
import { renderTemplate01 } from './template-01.js';
import { renderTemplate02 } from './template-02.js';
import { renderTemplate03 } from './template-03.js';
import { renderTemplate05 } from './template-05.js';
import { renderTemplate07 } from './template-07.js';

export const TEMPLATE_REGISTRY = {
  'template-01': {
    name: 'Minimal Digital Card',
    category: 'Personal & Freelancer',
    render: renderTemplate01,
  },
  'template-02': {
    name: 'Product Catalog Showcase',
    category: 'E-commerce & Store',
    render: renderTemplate02,
  },
  'template-03': {
    name: 'Creative Agency Studio',
    category: 'Agency & Portfolio',
    render: renderTemplate03,
  },
  'template-05': {
    name: 'Local Business & WhatsApp Store',
    category: 'Local Shop & Services',
    render: renderTemplate05,
  },
  'template-07': {
    name: 'Food, Cafe & Restaurant Menu',
    category: 'Restaurant & Dining',
    render: renderTemplate07,
  }
};

/**
 * Renders HTML for any profile based on its templateId
 * @param {Object} profile 
 * @param {boolean} isStandalone 
 * @returns {string} HTML markup
 */
export function renderProfileTemplate(profile, isStandalone = false) {
  if (!profile) {
    return `
      <div class="p-8 text-center text-slate-500 font-sans">
        <p class="text-sm font-bold">No profile loaded</p>
      </div>
    `;
  }

  const templateId = String(profile.templateId || 'template-01').toLowerCase();
  const entry = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY['template-01'];

  try {
    return entry.render(profile, isStandalone);
  } catch (err) {
    console.error(`Error rendering template ${templateId}:`, err);
    return renderTemplate01(profile, isStandalone);
  }
}

export default {
  TEMPLATE_REGISTRY,
  renderProfileTemplate
};
