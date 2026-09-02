/**
 * Template 07: Food, Cafe & Restaurant Digital Menu
 * Archetype: Dining menu, culinary highlights, direct order booking
 */
export function renderTemplate07(profile, isStandalone = false) {
  const data = profile.data || {};
  const title = data.restaurantName || data.cafeName || data.businessName || profile.subdomain || 'Bistro & Cafe';
  const tagline = data.cuisine || data.tagline || 'Artisanal Flavors & Fresh Daily Menu';
  const phone = data.phone || data.whatsapp || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const address = data.address || data.location || 'Downtown Food District';
  const timing = data.timings || data.hours || 'Open Daily 11:00 AM - 11:00 PM';
  const bannerUrl = data.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = data.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=ea580c&color=fff&size=160`;

  let menu = data.menuItems || data.specialties || data.dishes || [];
  if (typeof menu === 'string') {
    try { menu = JSON.parse(menu); } catch (e) { menu = []; }
  }

  if (menu.length === 0) {
    menu = [
      { name: 'Chef Special Platter', price: '$22.00', desc: 'Signature preparation with seasonal organic sides' },
      { name: 'Artisanal Truffle Pasta', price: '$18.50', desc: 'Handcrafted noodles in rich mushroom truffle reduction' },
      { name: 'Wood-fired Sourdough Pizza', price: '$16.00', desc: 'Fresh mozzarella, san marzano tomatoes, fresh basil' }
    ];
  }

  return `
    <div class="w-full ${isStandalone ? 'min-h-screen' : 'min-h-[600px]'} bg-amber-950/20 text-slate-900 font-serif pb-16">
      
      <!-- Hero -->
      <div class="relative h-64 sm:h-80 w-full overflow-hidden bg-stone-900">
        <img src="${bannerUrl}" alt="${title}" class="w-full h-full object-cover opacity-70" />
        <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent"></div>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4 space-y-2">
          <img src="${avatarUrl}" alt="${title}" class="w-16 h-16 rounded-full border-2 border-amber-400/80 shadow-lg mb-1" />
          <h1 class="text-3xl sm:text-4xl font-bold text-amber-50 tracking-wide">${title}</h1>
          <p class="text-amber-200/90 text-sm italic font-sans">${tagline}</p>
          <div class="text-xs text-stone-300 font-sans mt-1">📍 ${address} • ⏰ ${timing}</div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-3xl mx-auto px-6 -mt-6 relative z-10 space-y-6">
        
        <!-- Action Bar -->
        <div class="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-amber-200/60 flex items-center justify-between gap-4 font-sans">
          <div class="text-xs text-stone-600 font-medium">
            Table Reservations & Online Takeaway
          </div>
          <div class="flex items-center gap-2">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(title)},%20I%20would%20like%20to%20reserve%20a%20table" target="_blank" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition">
                Reserve via WhatsApp
              </a>
            ` : ''}
            ${phone ? `
              <a href="tel:${phone}" class="px-3 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl transition">
                Call Bistro
              </a>
            ` : ''}
          </div>
        </div>

        <!-- Menu Section -->
        <div class="bg-white rounded-3xl p-8 shadow-xl border border-stone-200 space-y-6">
          <div class="text-center space-y-1 border-b border-stone-100 pb-4">
            <h3 class="text-2xl font-bold text-stone-900 tracking-wide">Featured Culinary Menu</h3>
            <p class="text-xs text-stone-500 font-sans">Prepared fresh to order using finest ingredients</p>
          </div>

          <div class="space-y-5">
            ${menu.map(item => `
              <div class="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                <div class="space-y-1">
                  <h4 class="text-base font-bold text-stone-900 font-sans">${item.name || item.title || 'Special Dish'}</h4>
                  <p class="text-xs text-stone-500 leading-relaxed font-sans">${item.desc || item.description || ''}</p>
                </div>
                <div class="text-base font-bold text-amber-800 font-mono whitespace-nowrap">
                  ${item.price || '$--'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="text-center text-xs text-stone-500 font-sans">
          ${profile.subdomain} • Digital Menu Powered by Business Profiles
        </div>

      </div>
    </div>
  `;
}

export default renderTemplate07;
