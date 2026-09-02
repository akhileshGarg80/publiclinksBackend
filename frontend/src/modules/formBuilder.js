/**
 * Dynamic Form Builder
 * Generates interactive inputs based on template schema fields
 */
import { api } from './apiClient.js';
import { showToast } from './toast.js';

export function buildDynamicForm(fields = {}, containerElement, initialData = {}) {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  const fieldEntries = Object.entries(fields);
  if (fieldEntries.length === 0) {
    containerElement.innerHTML = '<div class="text-slate-400 italic text-sm py-4">No custom fields defined for this template.</div>';
    return;
  }

  fieldEntries.forEach(([fieldName, config]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-1.5 text-left';

    const label = document.createElement('label');
    label.className = 'block text-xs font-bold text-slate-700';
    label.innerHTML = `${config.label || fieldName} ${config.required ? '<span class="text-rose-500">*</span>' : '<span class="text-slate-400 font-normal">(optional)</span>'}`;
    wrapper.appendChild(label);

    const val = initialData[fieldName] !== undefined ? initialData[fieldName] : (config.default || '');

    if (config.type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.name = fieldName;
      textarea.rows = 3;
      textarea.placeholder = config.placeholder || '';
      textarea.value = val;
      textarea.className = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs text-slate-800 transition bg-white';
      wrapper.appendChild(textarea);
    } else if (config.type === 'image' || config.type === 'ai-image') {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'flex items-center gap-2';

      const input = document.createElement('input');
      input.type = 'text';
      input.name = fieldName;
      input.placeholder = config.placeholder || 'https://... or click Upload';
      input.value = val;
      input.className = 'flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs text-slate-800 transition bg-white';

      const fileBtn = document.createElement('label');
      fileBtn.className = 'px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-1 shrink-0';
      fileBtn.innerHTML = '📁 Upload';

      const hiddenFile = document.createElement('input');
      hiddenFile.type = 'file';
      hiddenFile.accept = 'image/*';
      hiddenFile.className = 'hidden';
      hiddenFile.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showToast('Uploading image...', 'info');
        const reader = new FileReader();
        reader.onload = async () => {
          const res = await api.uploadImage(reader.result, file.name);
          if (res.success && res.url) {
            input.value = res.url;
            showToast('Image uploaded successfully!', 'success');
          } else {
            showToast('Upload failed, using local data URL', 'warning');
            input.value = reader.result;
          }
        };
        reader.readAsDataURL(file);
      };

      fileBtn.appendChild(hiddenFile);
      imgContainer.appendChild(input);
      imgContainer.appendChild(fileBtn);
      wrapper.appendChild(imgContainer);
    } else {
      const input = document.createElement('input');
      input.type = config.type === 'number' || config.type === 'price' ? 'number' : 'text';
      input.name = fieldName;
      input.placeholder = config.placeholder || '';
      input.value = val;
      input.className = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs text-slate-800 transition bg-white';
      wrapper.appendChild(input);
    }

    if (config.description) {
      const desc = document.createElement('p');
      desc.className = 'text-[10px] text-slate-400';
      desc.innerText = config.description;
      wrapper.appendChild(desc);
    }

    containerElement.appendChild(wrapper);
  });
}

export function extractFormData(containerElement) {
  if (!containerElement) return {};
  const data = {};
  const inputs = containerElement.querySelectorAll('input[name], textarea[name], select[name]');
  inputs.forEach(el => {
    const name = el.getAttribute('name');
    if (name) {
      data[name] = el.value.trim();
    }
  });
  return data;
}

export default {
  buildDynamicForm,
  extractFormData
};
