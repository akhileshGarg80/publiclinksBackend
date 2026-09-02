/**
 * Template 01: Minimal Clean Digital Card
 * Archetype: Minimalist personal & freelancer digital bio card
 */
export function renderTemplate01(profile, isStandalone = false) {
  const data = profile.data || {};
  const title = data.name || data.fullName || data.businessName || profile.subdomain || 'Digital Card';
  const tagline = data.headline || data.tagline || data.profession || data.bio || data.aboutText || '';
  const phone = data.whatsapp || data.phone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const email = data.email || '';
  const address = data.location || data.address || '';
  const avatarUrl = data.avatar || data.profileImage || data.avatarUrl || data.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=0284c7&color=fff&size=160`;

  let items = data.services || data.skills || data.portfolioItems || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch (e) { items = []; }
  }

  return `
    <div class="w-full ${isStandalone ? 'min-h-screen' : 'min-h-[580px]'} bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 py-12 px-4 flex items-center justify-center font-sans">
      <div class="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden text-center p-8 space-y-6">
        
        <!-- Avatar with active badge -->
        <div class="relative inline-block mx-auto">
          <img src="${avatarUrl}" alt="${title}" class="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md mx-auto bg-slate-100" />
          <span class="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Verified Online"></span>
        </div>

        <!-- Header Info -->
        <div class="space-y-1.5">
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">${title}</h1>
          <p class="text-sm font-medium text-slate-600">${tagline}</p>
          ${address ? `<p class="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1"><span>📍</span> ${address}</p>` : ''}
        </div>

        <!-- Direct Contact Actions -->
        <div class="space-y-2.5 pt-2">
          ${cleanPhone ? `
            <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(title)}" target="_blank" class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-sm">
              <span>💬</span> Chat on WhatsApp
            </a>
          ` : ''}
          ${phone ? `
            <a href="tel:${phone}" class="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-sm">
              <span>📞</span> Call Direct (${phone})
            </a>
          ` : ''}
          ${email ? `
            <a href="mailto:${email}" class="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 border border-slate-200">
              <span>✉️</span> Send Email (${email})
            </a>
          ` : ''}
          ${data.websiteUrl ? `
            <a href="${data.websiteUrl}" target="_blank" class="w-full py-3 px-4 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 border border-sky-200">
              <span>🌐</span> Visit Website
            </a>
          ` : ''}
        </div>

        <!-- Services / Offerings -->
        ${items.length > 0 ? `
          <div class="pt-4 border-t border-slate-100 space-y-2 text-left">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Services & Highlights</h4>
            <div class="space-y-2">
              ${items.map(it => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">${typeof it === 'string' ? it : (it.name || it.title || 'Service')}</span>
                  ${it.price ? `<span class="font-bold text-emerald-600">${it.price}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Social Channels -->
        <div class="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
          ${data.instagram ? `<a href="https://instagram.com/${data.instagram}" target="_blank" class="hover:text-pink-600 transition">📸 Instagram</a>` : ''}
          ${data.facebook ? `<a href="https://facebook.com/${data.facebook}" target="_blank" class="hover:text-blue-600 transition">📘 Facebook</a>` : ''}
          ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="hover:text-sky-700 transition">💼 LinkedIn</a>` : ''}
        </div>

        <div class="text-[11px] text-slate-400 font-mono pt-1">
          ${profile.subdomain} • Verified Profile
        </div>

      </div>
    </div>
  `;
}

export default renderTemplate01;
