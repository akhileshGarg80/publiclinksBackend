import { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  Globe, 
  FileJson, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  Terminal, 
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface TemplateItem {
  templateId: string;
  name: string;
  category: string;
  description: string;
  fieldCount: number;
  previewImage?: string;
  theme?: {
    accentColor?: string;
    layout?: string;
  };
  requiredFields?: Array<{ key: string; label: string; type: string }>;
}

interface ServerHealth {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    statusText: string;
    isUriConfigured: boolean;
  };
  config: {
    port: number;
    mainDomain: string;
    templatesCount: number;
  };
}

export default function App() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template-02');
  const [templateSchema, setTemplateSchema] = useState<any>(null);
  
  // Subdomain tester state
  const [subdomainInput, setSubdomainInput] = useState<string>('abcshop');
  const [subdomainResult, setSubdomainResult] = useState<any>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState<boolean>(false);

  // Quick Profile Creator state
  const [createSubdomain, setCreateSubdomain] = useState<string>('techbistro');
  const [createPassword, setCreatePassword] = useState<string>('secretPass123');
  const [createResult, setCreateResult] = useState<any>(null);
  const [creating, setCreating] = useState<boolean>(false);

  // Edit / Verify Tester state
  const [editProfileId, setEditProfileId] = useState<string>('');
  const [verifyPasswordInput, setVerifyPasswordInput] = useState<string>('secretPass123');
  const [editToken, setEditToken] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [editDataResult, setEditDataResult] = useState<any>(null);

  // Generic API console response
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'subdomain' | 'create' | 'edit' | 'endpoints'>('overview');
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplateSchema = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`);
      const data = await res.json();
      if (data.success) {
        setTemplateSchema(data.template);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchTemplates();
    fetchTemplateSchema('template-02');
  }, []);

  const handleCheckSubdomain = async () => {
    if (!subdomainInput) return;
    setCheckingSubdomain(true);
    try {
      const res = await fetch(`/api/profiles/check-subdomain/${encodeURIComponent(subdomainInput.trim())}`);
      const data = await res.json();
      setSubdomainResult(data);
    } catch (err: any) {
      setSubdomainResult({ success: false, error: err.message });
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleCreateTestProfile = async () => {
    setCreating(true);
    setCreateResult(null);
    try {
      const samplePayload = {
        templateId: selectedTemplateId,
        subdomain: createSubdomain.trim().toLowerCase(),
        password: createPassword,
        isPublished: true,
        data: {
          name: 'Tech Bistro & Cafe',
          description: 'Artisan handcrafted coffee & premium tech gadgets.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
          logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          price: 499,
          headline: 'Next-Gen Mobile & Coffee Studio',
          location: 'Civil Lines, Satna, MP',
          whatsapp: '+919876543210',
          products: [
            { title: 'Wireless ANC Headphones', price: 2499 },
            { title: 'Espresso Roast Blend', price: 350 }
          ],
          menu: [
            { title: 'Artisan Cappuccino', price: 180, isVeg: true },
            { title: 'Avocado Toast', price: 260, isVeg: true }
          ]
        }
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload)
      });
      const data = await res.json();
      setCreateResult(data);
      if (data.success && data.profile?.id) {
        setEditProfileId(data.profile.id);
      }
    } catch (err: any) {
      setCreateResult({ success: false, error: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!editProfileId || !verifyPasswordInput) return;
    try {
      const res = await fetch(`/api/profiles/${editProfileId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: verifyPasswordInput })
      });
      const data = await res.json();
      setVerifyResult(data);
      if (data.success && data.token) {
        setEditToken(data.token);
      }
    } catch (err: any) {
      setVerifyResult({ success: false, error: err.message });
    }
  };

  const handleLoadEditData = async () => {
    if (!editProfileId || !editToken) return;
    try {
      const res = await fetch(`/api/profiles/${editProfileId}/edit`, {
        headers: { 'Authorization': `Bearer ${editToken}` }
      });
      const data = await res.json();
      setEditDataResult(data);
    } catch (err: any) {
      setEditDataResult({ success: false, error: err.message });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 tracking-tight">Business Profile Platform</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Backend API v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">1 Master Model · Dynamic Templates · Subdomain Routing</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { fetchHealth(); fetchTemplates(); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${health?.database?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-medium">
                {health?.database?.connected ? 'MongoDB Connected' : 'Memory Fallback Active'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'Architecture & Status', icon: Server },
            { id: 'templates', label: 'Template Schemas', icon: Layers },
            { id: 'subdomain', label: 'Subdomain Availability', icon: Globe },
            { id: 'create', label: 'Create Profile Test', icon: Send },
            { id: 'edit', label: 'Edit & Password Verify', icon: KeyRound },
            { id: 'endpoints', label: 'API Endpoints (8)', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Database Engine</span>
                  <Database className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-lg font-bold text-slate-100">MongoDB + DNS 8.8.8.8</div>
                <p className="text-xs text-slate-500 mt-1">SRV resolution via Google & Cloudflare DNS</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Template System</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-slate-100">{templates.length} Trusted Templates</div>
                <p className="text-xs text-slate-500 mt-1">Zero-code addition in src/templates/*.json</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Data Architecture</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-lg font-bold text-slate-100">1 Master Model</div>
                <p className="text-xs text-slate-500 mt-1">Preserves master data across switches</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Security & Auth</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-lg font-bold text-slate-100">bcrypt + JWT Sessions</div>
                <p className="text-xs text-slate-500 mt-1">Rate limited & helmet protected</p>
              </div>
            </div>

            {/* Architecture Flow Diagram Box */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Backend Execution Pipeline</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-indigo-400 mb-1">1. DNS & Request</div>
                  <p className="text-slate-400">Host header extracts subdomain `abcshop.domain.com` or header `x-subdomain`</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-indigo-400 mb-1">2. Security Gate</div>
                  <p className="text-slate-400">Helmet, CORS, body limits (2MB), express-rate-limit, reserved check</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-indigo-400 mb-1">3. Trusted Template</div>
                  <p className="text-slate-400">Loads trusted server JSON from `src/templates/` to validate fields</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-indigo-400 mb-1">4. Master Data Store</div>
                  <p className="text-slate-400">1 single Profile document with unique subdomain index & bcrypt password</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-indigo-400 mb-1">5. Safe Edit Switch</div>
                  <p className="text-slate-400">JWT edit token allows changing template while retaining all master data keys</p>
                </div>
              </div>
            </div>

            {/* Health Info Details */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Live Server Configuration</h3>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-emerald-400 overflow-x-auto font-mono">
                {JSON.stringify(health || { loading: true }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Server-Side Trusted Templates</h2>
                <p className="text-xs text-slate-400">Stored in /src/templates/*.json — validated server-side</p>
              </div>
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                {templates.length} templates available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div 
                  key={t.templateId}
                  onClick={() => {
                    setSelectedTemplateId(t.templateId);
                    fetchTemplateSchema(t.templateId);
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all border text-left ${
                    selectedTemplateId === t.templateId 
                      ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">{t.templateId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{t.category}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-100">{t.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{t.fieldCount} fields defined</span>
                    <span className="text-indigo-400 flex items-center">
                      View JSON <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Template Schema Inspector */}
            {templateSchema && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileJson className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">
                      Schema for <span className="font-mono text-indigo-400">{templateSchema.templateId}</span> ({templateSchema.name})
                    </span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(templateSchema, null, 2), 'schema')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1"
                  >
                    {copiedCurl === 'schema' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurl === 'schema' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 overflow-x-auto max-h-96 font-mono">
                  {JSON.stringify(templateSchema, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Subdomain Checker */}
        {activeTab === 'subdomain' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Live Subdomain Availability Tester</h2>
              <p className="text-xs text-slate-400">Tests GET /api/profiles/check-subdomain/:subdomain with format & reserved checks</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Subdomain Candidate
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={subdomainInput}
                      onChange={(e) => setSubdomainInput(e.target.value.toLowerCase())}
                      placeholder="e.g. abcshop, mybistro"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400">.yourdomain.com</span>
                  <button 
                    onClick={handleCheckSubdomain}
                    disabled={checkingSubdomain}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    {checkingSubdomain ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>Check Availability</span>
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-800">
                <span>Try quick tests:</span>
                {['abcshop', 'admin', 'royal-bistro', 'api', 'cool_shop'].map(sub => (
                  <button 
                    key={sub}
                    onClick={() => { setSubdomainInput(sub); }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Result display */}
              {subdomainResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  subdomainResult.available 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center space-x-2 font-semibold">
                    {subdomainResult.available ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>Status: {subdomainResult.status || (subdomainResult.available ? 'Available' : 'Unavailable')}</span>
                  </div>
                  <p className="text-slate-300">{subdomainResult.message || subdomainResult.reason || subdomainResult.error}</p>
                  <pre className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                    {JSON.stringify(subdomainResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Create Profile Test */}
        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Test Profile Creator</h2>
              <p className="text-xs text-slate-400">Tests POST /api/profiles with template validation, password hashing, and master data</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Template</label>
                  <select 
                    value={selectedTemplateId} 
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {templates.map(t => (
                      <option key={t.templateId} value={t.templateId}>{t.templateId} - {t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subdomain</label>
                  <input 
                    type="text"
                    value={createSubdomain}
                    onChange={(e) => setCreateSubdomain(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Edit Password</label>
                  <input 
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleCreateTestProfile}
                  disabled={creating}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-500/20"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit POST /api/profiles</span>
                </button>
              </div>

              {createResult && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">API Response:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${createResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {createResult.success ? '201 Created' : 'Error'}
                    </span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 overflow-x-auto font-mono max-h-60">
                    {JSON.stringify(createResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Edit & Password Verify */}
        {activeTab === 'edit' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Edit Authentication & Master Data Flow</h2>
              <p className="text-xs text-slate-400">Verifies password with bcrypt and exchanges for short-lived JWT edit token</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Profile ID</label>
                  <input 
                    type="text"
                    value={editProfileId}
                    onChange={(e) => setEditProfileId(e.target.value)}
                    placeholder="e.g. 65e8a9d... or mem_..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Password</label>
                  <input 
                    type="password"
                    value={verifyPasswordInput}
                    onChange={(e) => setVerifyPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={handleVerifyPassword}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>1. Verify Password (POST /verify)</span>
                </button>

                <button 
                  onClick={handleLoadEditData}
                  disabled={!editToken}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-40"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>2. Load Master Data (GET /edit)</span>
                </button>
              </div>

              {verifyResult && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="font-semibold text-indigo-400 mb-1">Verify Result:</div>
                  <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(verifyResult, null, 2)}
                  </pre>
                </div>
              )}

              {editDataResult && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="font-semibold text-emerald-400 mb-1">Master Data (Authenticated Edit Session):</div>
                  <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60">
                    {JSON.stringify(editDataResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Endpoints List */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Core Backend Endpoints Specification</h2>
              <p className="text-xs text-slate-400">Full details also available in endpoint.md</p>
            </div>

            <div className="space-y-3">
              {[
                { method: 'GET', path: '/api/templates', desc: 'List all available templates with summary info and required field tags.' },
                { method: 'GET', path: '/api/templates/:templateId', desc: 'Fetch single trusted JSON template schema for dynamic form rendering.' },
                { method: 'GET', path: '/api/profiles/check-subdomain/:subdomain', desc: 'Check live subdomain availability against unique index & reserved list.' },
                { method: 'POST', path: '/api/profiles', desc: 'Create profile with trusted template validation, subdomain indexing, & password hash.' },
                { method: 'GET', path: '/api/profiles/:subdomain', desc: 'Public profile retrieval with template design metadata (omits passwordHash).' },
                { method: 'POST', path: '/api/profiles/:id/verify', desc: 'Verify edit password with bcrypt and generate short-lived JWT edit session.' },
                { method: 'GET', path: '/api/profiles/:id/edit', desc: 'Load existing master data for verified edit session (guarded with JWT).' },
                { method: 'PATCH', path: '/api/profiles/:id', desc: 'Update profile data, switch templateId without losing master data, or update password.' },
              ].map((ep, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      ep.method === 'GET' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                      ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-100">{ep.path}</span>
                  </div>
                  <span className="text-xs text-slate-400 max-w-md">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
