/**
 * Template 05: Local Business & WhatsApp Direct Store
 * Archetype: Local commerce, neighborhood services, instant WhatsApp inquiries
 */
export function renderTemplate05(profile, isStandalone = false) {
  const data = profile.data || {};
  const title = data.businessName || profile.subdomain || 'Local Business';
  const tagline = data.tagline || data.category || 'Local Shop & Services';
  const phone = data.phone || data.whatsapp || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const address = data.address || data.location || 'Visit our local branch';
  const hours = data.businessHours || data.timing || 'Mon-Sat: 9:00 AM - 9:00 PM';
  const avatarUrl = data.logoUrl || data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=059669&color=fff&size=160`;

  let offers = data.offers || data.products || data.services || [];
  if (typeof offers === 'string') {
    try { offers = JSON.parse(offers); } catch (e) { offers = []; }
  }

  return `
    <div class="w-full ${isStandalone ? 'min-h-screen' : 'min-h-[580px]'} bg-slate-50 text-slate-800 font-sans pb-12">
      <!-- Top banner -->
      <div class="bg-emerald-700 text-white py-8 px-6 text-center shadow-md">
        <div class="max-w-md mx-auto space-y-3">
          <img src="${avatarUrl}" alt="${title}" class="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-white shadow-md bg-white" />
          <h1 class="text-2xl font-black tracking-tight">${title}</h1>
          <p class="text-emerald-100 text-xs font-medium">${tagline}</p>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 rounded-full text-[11px] text-emerald-200">
            <span>⏰</span> ${hours}
          </div>
        </div>
      </div>

      <div class="max-w-md mx-auto px-4 -mt-4 space-y-4">
        <!-- Quick Action Box -->
        <div class="bg-white p-5 rounded-2xl shadow-lg border border-slate-200/80 space-y-3">
          <div class="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span>📍</span> <span>${address}</span>
          </div>

          ${cleanPhone ? `
            <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(title)},%20I%20have%20an%20inquiry" target="_blank" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
              <span>💬</span> Send WhatsApp Message
            </a>
          ` : ''}

          ${phone ? `
            <a href="tel:${phone}" class="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2">
              <span>📞</span> Call Now (${phone})
            </a>
          ` : ''}
        </div>

        <!-- Offerings List -->
        ${offers.length > 0 ? `
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Services & Products</h3>
            <div class="space-y-2.5">
              ${offers.map(o => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">${typeof o === 'string' ? o : (o.name || o.title)}</span>
                  ${o.price ? `<span class="font-bold text-emerald-700">${o.price}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="text-center text-[11px] text-slate-400 font-mono">
          ${profile.subdomain} • Direct Business Portal
        </div>
      </div>
    </div>
  `;
}

export default renderTemplate05;
