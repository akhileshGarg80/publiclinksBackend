/**
 * Template 02: Product Catalog & Luxury Showcase
 * Archetype: E-commerce storefront & item showcase with direct WhatsApp ordering
 */
export function renderTemplate02(profile, isStandalone = false) {
  const data = profile.data || {};
  const title = data.storeName || data.businessName || profile.subdomain || 'Store Catalog';
  const tagline = data.tagline || data.description || 'Quality Products & Custom Collections';
  const phone = data.phone || data.whatsapp || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const bannerUrl = data.bannerImage || data.coverImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = data.logoUrl || data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=f59e0b&color=000&size=160`;
  const address = data.address || data.location || 'Online Store';

  let items = data.products || data.items || data.services || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch (e) { items = []; }
  }

  if (items.length === 0) {
    items = [
      { name: 'Featured Collection #1', price: '$49.00', description: 'Handcrafted signature release made with premium materials.' },
      { name: 'Signature Series #2', price: '$89.00', description: 'Best-selling flagship product with complete authenticity guarantee.' },
      { name: 'Custom Package #3', price: '$120.00', description: 'Tailored specifically to your custom requirements and preferences.' }
    ];
  }

  return `
    <div class="w-full ${isStandalone ? 'min-h-screen' : 'min-h-[600px]'} bg-slate-950 text-white pb-16 font-sans">
      
      <!-- Hero Banner -->
      <div class="relative h-64 sm:h-80 w-full overflow-hidden">
        <img src="${bannerUrl}" alt="${title}" class="w-full h-full object-cover opacity-60" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        
        <div class="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-mono text-amber-400 border border-amber-500/30 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Catalog Mode • ${profile.subdomain}
        </div>
      </div>

      <!-- Profile Header -->
      <div class="max-w-5xl mx-auto px-6 -mt-20 relative z-10 space-y-8">
        <div class="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 border-b border-slate-800 pb-6 text-center sm:text-left">
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <img src="${avatarUrl}" alt="${title}" class="w-28 h-28 rounded-2xl object-cover border-2 border-amber-500/50 shadow-2xl bg-slate-900" />
            <div class="space-y-1">
              <h1 class="text-3xl font-extrabold text-white tracking-tight">${title}</h1>
              <p class="text-slate-400 text-sm max-w-xl font-medium">${tagline}</p>
              <div class="text-xs text-amber-400/90 font-mono">📍 ${address}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(title)},%20I%20want%20to%20place%20an%20order" target="_blank" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5">
                <span>🛒</span> WhatsApp Order
              </a>
            ` : ''}
            ${phone ? `
              <a href="tel:${phone}" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition">
                Call Store
              </a>
            ` : ''}
          </div>
        </div>

        <!-- Product Grid -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-100">Featured Products & Catalog</h3>
            <span class="text-xs text-slate-500 font-mono">${items.length} items available</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            ${items.map(it => `
              <div class="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-3 transition flex flex-col justify-between group">
                <div class="space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-bold text-white text-base group-hover:text-amber-400 transition">${it.name || it.title || 'Product'}</h4>
                    <span class="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-lg">${it.price || '$--'}</span>
                  </div>
                  <p class="text-xs text-slate-400 leading-relaxed">${it.description || it.desc || 'High quality selection available directly from our collection.'}</p>
                </div>

                ${cleanPhone ? `
                  <a href="https://wa.me/${cleanPhone}?text=I%20am%20interested%20in%20${encodeURIComponent(it.name || it.title || 'Product')}" target="_blank" class="mt-4 w-full py-2 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition text-center block">
                    Order This Item →
                  </a>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

export default renderTemplate02;
