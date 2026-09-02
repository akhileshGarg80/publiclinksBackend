/**
 * Template 03: Creative Agency & Studio
 * Archetype: Sleek dark high-contrast agency and portfolio showcase
 */
export function renderTemplate03(profile, isStandalone = false) {
  const data = profile.data || {};
  const title = data.agencyName || data.businessName || profile.subdomain || 'Creative Studio';
  const tagline = data.tagline || data.missionStatement || 'Design & Digital Solutions';
  const phone = data.phone || data.whatsapp || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const email = data.email || 'hello@agency.com';
  const address = data.location || data.address || '';
  const bannerUrl = data.heroBanner || data.bannerImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = data.logoUrl || data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=6366f1&color=fff&size=160`;

  let services = data.services || data.caseStudies || [];
  if (typeof services === 'string') {
    try { services = JSON.parse(services); } catch (e) { services = []; }
  }

  return `
    <div class="w-full ${isStandalone ? 'min-h-screen' : 'min-h-[600px]'} bg-slate-950 text-slate-100 font-sans pb-16">
      
      <!-- Studio Header -->
      <div class="relative h-72 sm:h-96 w-full overflow-hidden bg-slate-900">
        <img src="${bannerUrl}" alt="${title}" class="w-full h-full object-cover opacity-40 filter grayscale contrast-125" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
        
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <span class="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs uppercase tracking-widest">
            Creative Studio • ${profile.subdomain}
          </span>
          <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl">${title}</h1>
          <p class="text-slate-400 text-sm sm:text-base max-w-lg font-medium">${tagline}</p>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-6 space-y-12 -mt-8 relative z-10">
        
        <!-- Contact Strip -->
        <div class="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img src="${avatarUrl}" alt="${title}" class="w-14 h-14 rounded-xl object-cover border border-indigo-500/40 bg-slate-800" />
            <div>
              <h3 class="font-bold text-white text-base">${title}</h3>
              <p class="text-xs text-slate-400 font-mono">${address || 'Global Studio'}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(title)}" target="_blank" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5">
                <span>💬</span> WhatsApp
              </a>
            ` : ''}
            ${email ? `
              <a href="mailto:${email}" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">
                Start Project ✉️
              </a>
            ` : ''}
          </div>
        </div>

        <!-- Capabilities -->
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-white tracking-tight">Studio Capabilities</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            ${(services.length > 0 ? services : [
              { name: 'Brand Identity', desc: 'Distinct visual strategy and typography systems.' },
              { name: 'Web Engineering', desc: 'Performant, responsive digital experiences.' },
              { name: 'Digital Growth', desc: 'Campaign architecture and conversion optimization.' }
            ]).map(s => `
              <div class="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2 hover:border-indigo-500/40 transition">
                <h4 class="font-bold text-white text-base">${s.name || s.title || 'Service'}</h4>
                <p class="text-xs text-slate-400 leading-relaxed">${s.description || s.desc || 'High impact studio delivery.'}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

export default renderTemplate03;
