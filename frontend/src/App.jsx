import { useState, useEffect } from 'react'
import { Sparkles, Droplet, Check, X, Pencil, Trash2, Wallet, Package, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createPerfume, updatePerfume, deletePerfume, listPerfumes, listSales, sellPerfume, deleteSale, confirmSale } from './api'
import Login from './Login';

const tabs = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'attente', label: 'En attente' },
  { id: 'ventes', label: 'Ventes' },
]

const emptyForm = { name: '', brand: '', category: 'parfums', buyPrice: '', sellPrice: '', stock: '' }

const CATEGORY_LABELS = {
  parfums: 'Parfums',
  chaussures: 'Chaussures',
  electronique: 'Électronique',
  autre: 'Autre',
}

export default function App() {
  const [tab, setTab] = useState('apercu')
  const [showGains, setShowGains] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  const THEME_HEX =
    theme === 'dark'
      ? { accent: '#4caf7d', grid: '#2a2a2a', mutedText: '#9a9a9a', tooltipBg: '#161616', tooltipText: '#f2f2f2', tabActiveBg: '#1c1c1c', overlayBg: 'rgba(13,13,13,0.85)' }
      : { accent: '#2f9e64', grid: '#dcdcdc', mutedText: '#6b6b6b', tooltipBg: '#ffffff', tooltipText: '#1a1a1a', tabActiveBg: '#ffffff', overlayBg: 'rgba(255,255,255,0.85)' }

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function openAddForm() {
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setFormError('')
    setShowForm(true)
    setSuccessMsg('')
  }

  function openEditForm(p) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      brand: p.brand || '',
      category: p.category || 'parfums',
      buyPrice: String(p.buy_price),
      sellPrice: String(p.sell_price),
      stock: String(p.stock),
    })
    setImageFile(null)
    setImagePreview(p.image || null)
    setFormError('')
    setShowForm(true)
    setSuccessMsg('')
  }

  const [perfumes, setPerfumes] = useState([])
  const [loadingPerfumes, setLoadingPerfumes] = useState(true)
  const [sales, setSales] = useState([])

  async function refreshPerfumes() {
    try {
      const data = await listPerfumes()
      setPerfumes(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPerfumes(false)
    }
  }

  async function refreshSales() {
    try {
      const data = await listSales()
      setSales(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    refreshPerfumes()
    refreshSales()
  }, [])

  const [selectedCategory, setSelectedCategory] = useState('tous')
  const confirmedSales = sales.filter((s) => s.status === 'confirmed')
  const pendingSales = sales.filter((s) => s.status === 'pending')
  const filteredPerfumes = selectedCategory === 'tous' ? perfumes : perfumes.filter((p) => p.category === selectedCategory)
  const filteredSales = selectedCategory === 'tous' ? confirmedSales : confirmedSales.filter((s) => s.category === selectedCategory)

  const totalGain = filteredSales.reduce((sum, s) => sum + s.gain, 0)
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.revenue, 0)
  const stockValue = filteredPerfumes.reduce((sum, p) => sum + p.stock * p.buy_price, 0)
  const stockUnits = filteredPerfumes.reduce((sum, p) => sum + p.stock, 0)

  const chartData = (() => {
    if (filteredSales.length === 0) return []
    const byDate = {}
    filteredSales.forEach((s) => {
      byDate[s.date] = (byDate[s.date] || 0) + s.gain
    })
    const dates = Object.keys(byDate).sort()
    let cumul = 0
    return dates.map((d) => {
      cumul += byDate[d]
      return { date: d, gains: cumul }
    })
  })()

  const [sellingId, setSellingId] = useState(null)
  const [sellQuantity, setSellQuantity] = useState(1)
  const [sellError, setSellError] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [confirmPendingId, setConfirmPendingId] = useState(null)
  const [confirmPendingError, setConfirmPendingError] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete(perfume) {
    setDeleteError('')
    try {
      await deletePerfume(perfume.id)
      setConfirmDeleteId(null)
      refreshPerfumes()
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  const [confirmDeleteSaleId, setConfirmDeleteSaleId] = useState(null)
  const [deleteSaleError, setDeleteSaleError] = useState('')

  function isSaleRecent(s) {
    return Date.now() - new Date(s.created_at).getTime() < 24 * 60 * 60 * 1000
  }

  async function confirmDeleteSale(sale) {
    setDeleteSaleError('')
    try {
      await deleteSale(sale.id)
      setConfirmDeleteSaleId(null)
      refreshSales()
      refreshPerfumes()
    } catch (err) {
      setDeleteSaleError(err.message)
    }
  }

  function startSell(perfume) {
    setSellingId(perfume.id)
    setSellQuantity(1)
    setSellError('')
    setCustomerName('')
    setCustomerPhone('')
  }

  async function confirmSell(perfume) {
    setSellError('')
    if (!customerName.trim()) {
      setSellError('Le nom du client est obligatoire.')
      return
    }
    try {
      await sellPerfume(perfume.id, sellQuantity, customerName.trim(), customerPhone.trim())
      setSellingId(null)
      refreshPerfumes()
      refreshSales()
    } catch (err) {
      setSellError(err.message)
    }
  }

  async function confirmPendingSale(sale) {
    setConfirmPendingError('')
    try {
      await confirmSale(sale.id)
      setConfirmPendingId(null)
      refreshPerfumes()
      refreshSales()
    } catch (err) {
      setConfirmPendingError(err.message)
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('brand', form.brand)
      fd.append('category', form.category)
      fd.append('buy_price', form.buyPrice)
      fd.append('sell_price', form.sellPrice)
      fd.append('stock', form.stock)
      if (imageFile) fd.append('image', imageFile)

      if (editingId) {
        const updated = await updatePerfume(editingId, fd)
        setSuccessMsg(`« ${updated.name} » mis à jour avec succès.`)
      } else {
        const created = await createPerfume(fd)
        setSuccessMsg(`« ${created.name} » ajouté avec succès.`)
      }
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview(null)
      setEditingId(null)
      setShowForm(false)
      refreshPerfumes()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }
  return (
    <div className={`min-h-screen bg-ink ${theme === 'light' ? 'theme-light' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-16 text-cream">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-gold" />
              <h1 className="font-display text-4xl sm:text-5xl text-cream">Mon Comptoir</h1>
            </div>
            <p className="font-body text-base text-gold-dim mt-2">Stock, ventes et gains, en un coup d'œil.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-full text-red-500 hover:text-red-400 font-semibold transition-colors"
          >
            Déconnexion
          </button>
        </div>

        <div className="inline-flex bg-panel rounded-lg p-1.5 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-body px-6 py-3 rounded-md text-base font-medium transition-colors"
              style={{
                backgroundColor: tab === t.id ? THEME_HEX.tabActiveBg : 'transparent',
                color: tab === t.id ? THEME_HEX.accent : THEME_HEX.mutedText,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-panel rounded-2xl p-6 sm:p-10 border border-hairline">
          {tab === 'apercu' ? (
            <>
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory('tous')}
                className="font-body text-sm px-4 py-2 rounded-full transition-colors"
                style={{
                  backgroundColor: selectedCategory === 'tous' ? THEME_HEX.accent : 'transparent',
                  color: selectedCategory === 'tous' ? THEME_HEX.tooltipBg : THEME_HEX.mutedText,
                  border: `1px solid ${selectedCategory === 'tous' ? THEME_HEX.accent : THEME_HEX.grid}`,
                }}
              >
                Tous
              </button>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  className="font-body text-sm px-4 py-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: selectedCategory === value ? THEME_HEX.accent : 'transparent',
                    color: selectedCategory === value ? THEME_HEX.tooltipBg : THEME_HEX.mutedText,
                    border: `1px solid ${selectedCategory === value ? THEME_HEX.accent : THEME_HEX.grid}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <div className="w-36 h-16 rounded-full bg-panel-2 border-2 border-silver flex flex-col items-center justify-center">
                    <span className="font-body text-gold text-xs uppercase tracking-widest">Gains totaux</span>
                    <span className="font-display text-cream text-base">
                      {showGains ? `${totalGain.toLocaleString('fr-FR')} FCFA` : '••••••'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowGains((v) => !v)}
                    aria-label={showGains ? 'Masquer les gains' : 'Afficher les gains'}
                    className="p-2 rounded-full bg-panel-2 text-gold-dim hover:text-cream transition-colors"
                  >
                    {showGains ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-panel-2 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-hairline flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-gold-dim uppercase tracking-wide">Chiffre d'affaires</p>
                      <p className="font-money text-lg font-semibold text-cream">
                        {totalRevenue.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                  <div className="bg-panel-2 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-hairline flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-gold-dim uppercase tracking-wide">Valeur du stock</p>
                      <p className="font-money text-lg font-semibold text-cream">
                        {stockValue.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                  <div className="bg-panel-2 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-hairline flex items-center justify-center flex-shrink-0">
                      <Droplet className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-gold-dim uppercase tracking-wide">Flacons en stock</p>
                      <p className="font-money text-lg font-semibold text-cream">{stockUnits}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {chartData.length === 0 ? (
                  <div className="bg-panel-2 rounded-xl p-8 h-full flex items-center justify-center">
                    <p className="font-body text-sm text-gold-dim text-center">
                      Tes gains s'afficheront ici dès ta première vente.
                    </p>
                  </div>
                ) : (
                  <div className="bg-panel-2 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={THEME_HEX.accent} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={THEME_HEX.accent} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={THEME_HEX.grid} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          tick={{ fontSize: 12, fill: THEME_HEX.mutedText }}
                          axisLine={{ stroke: THEME_HEX.grid }}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => (v < 1000 ? v : Math.round(v / 1000) + 'k')}
                          tick={{ fontSize: 12, fill: THEME_HEX.mutedText }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          formatter={(v) => [v.toLocaleString('fr-FR') + ' FCFA', 'Gains cumulés']}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          contentStyle={{ background: THEME_HEX.tooltipBg, border: `1px solid ${THEME_HEX.grid}`, borderRadius: 8, fontSize: 13, color: THEME_HEX.tooltipText }}
                        />
                        <Area type="monotone" dataKey="gains" stroke={THEME_HEX.accent} strokeWidth={2} fill="url(#goldGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-hairline">
              {successMsg && (
                <div className="font-body mb-6 px-4 py-3 rounded-lg bg-panel-2 border border-silver text-gold text-sm">
                  {successMsg}
                </div>
              )}

              {!showForm && (
                <button
                  onClick={openAddForm}
                  className="font-body mb-8 px-5 py-2.5 rounded-lg bg-gold text-ink text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  + Ajouter un article
                </button>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="bg-panel-2 border border-hairline rounded-xl p-8 mb-8">
                  <p className="font-display text-xl text-cream mb-5">
                    {editingId ? 'Modifier cet article' : 'Nouvel article'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="block sm:col-span-2">
                      <span className="font-body text-base text-gold-dim">Nom du parfum</span>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="font-body mt-1.5 w-full rounded-lg border border-hairline bg-ink text-cream px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="font-body text-base text-gold-dim">Marque (optionnel)</span>
                      <input
                        value={form.brand}
                        onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                        className="font-body mt-1.5 w-full rounded-lg border border-hairline bg-ink text-cream px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="font-body text-base text-gold-dim">Catégorie</span>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="font-body mt-1.5 w-full rounded-lg border border-hairline bg-ink text-cream px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="font-body text-base text-gold-dim">Photo (optionnel)</span>
                      <div className="mt-1.5 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-ink border border-hairline flex items-center justify-center overflow-hidden flex-shrink-0">
                          {imagePreview ? (
                            <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Droplet className="w-7 h-7 text-gold-dim" />
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="font-body text-sm text-gold-dim file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-hairline file:text-cream hover:file:bg-panel"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="font-body text-base text-gold-dim">Prix d'achat (FCFA)</span>
                      <input
                        type="number"
                        value={form.buyPrice}
                        onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
                        className="font-money mt-1.5 w-full rounded-lg border border-hairline bg-ink text-cream px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </label>
                    <label className="block">
                      <span className="font-body text-base text-gold-dim">Prix de vente (FCFA)</span>
                      <input
                        type="number"
                        value={form.sellPrice}
                        onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))}
                        className="font-money mt-1.5 w-full rounded-lg border border-hairline bg-ink text-cream px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="font-body text-base text-gold-dim">
                        Stock {editingId ? 'actuel' : 'de départ'}
                      </span>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                        className="font-money mt-1.5 w-full rounded-lg border border-hairline bg-ink text-cream px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold sm:w-1/2"
                      />
                    </label>
                  </div>
                  {formError && <p className="font-body text-base text-red-400 mt-4">{formError}</p>}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="font-body px-6 py-3 rounded-lg bg-gold text-ink text-base font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {submitting ? 'Envoi…' : editingId ? 'Enregistrer' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="font-body px-6 py-3 rounded-lg bg-hairline text-cream text-base font-medium hover:bg-panel"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {loadingPerfumes ? (
                <p className="font-body text-base text-gold-dim">Chargement…</p>
              ) : filteredPerfumes.length === 0 ? (
                <p className="font-body text-base text-gold-dim">
                  {perfumes.length === 0
                    ? "Aucun article pour l'instant — ajoute le premier avec le bouton ci-dessus."
                    : 'Aucun article dans cette catégorie.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {filteredPerfumes.map((p) => (
                    <div key={p.id} className="bg-panel-2 border border-hairline rounded-xl p-4">
                      <div className="relative mb-3">
                        <div className="w-full aspect-square rounded-lg bg-ink flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Droplet className="w-9 h-9 text-gold-dim" />
                          )}
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          <button
                            onClick={() => openEditForm(p)}
                            aria-label="Modifier"
                            className="p-1.5 rounded-md text-gold hover:text-cream"
                            style={{ backgroundColor: THEME_HEX.overlayBg }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteId(p.id)
                              setDeleteError('')
                            }}
                            aria-label="Supprimer"
                            className="p-1.5 rounded-md text-gold hover:text-red-400"
                            style={{ backgroundColor: THEME_HEX.overlayBg }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-display text-lg text-cream truncate">{p.name}</p>
                        {p.stock === 0 && (
                          <span className="font-body text-xs px-2 py-0.5 rounded-full bg-hairline text-gold-dim flex-shrink-0">
                            Épuisé
                          </span>
                        )}
                        {p.stock > 0 && p.stock <= 2 && (
                          <span className="font-body text-xs px-2 py-0.5 rounded-full border border-silver text-gold flex-shrink-0">
                            Stock bas
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-silver mb-2">{CATEGORY_LABELS[p.category] || 'Autre'}</p>
                      <div className="font-body text-sm text-gold-dim space-y-1 mb-3">
                        <div className="flex justify-between">
                          <span>Achat</span>
                          <span className="font-money text-cream">{p.buy_price.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vente</span>
                          <span className="font-money text-cream">{p.sell_price.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gain</span>
                          <span className="font-money text-gold font-medium">{p.margin.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stock</span>
                          <span className="font-money text-cream">{p.stock}</span>
                        </div>
                      </div>
                      {confirmDeleteId === p.id ? (
                        <div>
                          <p className="font-body text-sm text-cream mb-2">Supprimer ce parfum ?</p>
                          {deleteError && <p className="font-body text-xs text-red-400 mb-2">{deleteError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmDelete(p)}
                              className="font-body flex-1 text-sm font-semibold py-2 rounded-lg bg-red-500 text-ink hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4" /> Confirmer
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-2 rounded-lg bg-hairline text-cream hover:bg-panel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : sellingId === p.id ? (
                        <div>
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <button type="button" onClick={() => setSellQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-md bg-hairline text-cream hover:bg-panel">−</button>
                            <span className="font-money text-base w-6 text-center text-cream">{sellQuantity}</span>
                            <button type="button" onClick={() => setSellQuantity((q) => Math.min(p.stock, q + 1))} className="w-8 h-8 rounded-md bg-hairline text-cream hover:bg-panel">+</button>
                          </div>
                          <input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nom du client *"
                            className="font-body w-full mb-1.5 rounded-lg border border-hairline bg-ink text-cream px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                          <input
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Téléphone (optionnel)"
                            className="font-body w-full mb-2 rounded-lg border border-hairline bg-ink text-cream px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                          {sellError && <p className="font-body text-xs text-red-400 mb-2">{sellError}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => confirmSell(p)} className="font-body flex-1 text-sm font-semibold py-2 rounded-lg bg-gold text-ink hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                              <Check className="w-4 h-4" /> Envoyer
                            </button>
                            <button onClick={() => setSellingId(null)} className="px-3 py-2 rounded-lg bg-hairline text-cream hover:bg-panel">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          disabled={p.stock === 0}
                          onClick={() => startSell(p)}
                          className="font-body w-full text-sm font-medium py-2 rounded-lg border border-silver text-gold hover:bg-panel disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Vendu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
          ) : tab === 'attente' ? (
            <div>
              <p className="font-display text-lg text-cream mb-6">En attente de réception client</p>
              {pendingSales.length === 0 ? (
                <p className="font-body text-base text-gold-dim">Aucune vente en attente.</p>
              ) : (
                <div className="divide-y divide-hairline">
                  {pendingSales.map((s) => (
                    <div key={s.id} className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-lg text-cream">{s.perfume_name}</p>
                          <p className="font-body text-sm text-gold-dim">{s.customer_name}{s.customer_phone ? ` · ${s.customer_phone}` : ''}</p>
                          <p className="font-body text-xs text-gold-dim">{new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                          <span className="font-money text-cream">{s.quantity} unité{s.quantity > 1 ? 's' : ''}</span>
                          <span className="font-money text-cream">{s.revenue.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex gap-2">
                          {confirmPendingId === s.id ? (
                            <>
                              {confirmPendingError && <span className="font-body text-xs text-red-400">{confirmPendingError}</span>}
                              <button onClick={() => confirmPendingSale(s)} className="font-body text-xs font-semibold px-3 py-1.5 rounded-lg bg-gold text-ink hover:opacity-90 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Confirmer réception
                              </button>
                              <button onClick={() => setConfirmPendingId(null)} className="p-1.5 rounded-lg bg-hairline text-cream">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setConfirmPendingId(s.id); setConfirmPendingError('') }}
                                className="font-body text-xs font-semibold px-3 py-1.5 rounded-lg border border-gold text-gold hover:bg-panel flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Reçu
                              </button>
                              <button
                                onClick={() => { setConfirmDeleteSaleId(s.id); setDeleteSaleError('') }}
                                className="p-1.5 rounded-lg bg-hairline text-red-400 hover:opacity-80"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {confirmDeleteSaleId === s.id && (
                            <div className="flex items-center gap-2 mt-2 w-full">
                              {deleteSaleError && <span className="font-body text-xs text-red-400">{deleteSaleError}</span>}
                              <button onClick={() => confirmDeleteSale(s)} className="font-body text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-ink hover:opacity-90">Annuler la vente</button>
                              <button onClick={() => setConfirmDeleteSaleId(null)} className="p-1.5 rounded-lg bg-hairline text-cream"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {confirmedSales.length === 0 ? (
                <p className="font-body text-base text-gold-dim">Aucune vente confirmée pour l'instant.</p>
              ) : (
                <div className="divide-y divide-hairline">
                  {confirmedSales.map((s) => (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-lg text-cream">{s.perfume_name}</p>
                        <p className="font-body text-sm text-gold-dim">
                          {new Date(s.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm sm:text-right">
                        <div>
                          <span className="text-gold-dim sm:hidden">Qté </span>
                          <span className="font-money text-cream">{s.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gold-dim sm:hidden">CA </span>
                          <span className="font-money text-cream">{s.revenue.toLocaleString('fr-FR')}</span>
                        </div>
                        <div>
                          <span className="text-gold-dim sm:hidden">Gain </span>
                          <span className="font-money text-gold font-medium">{s.gain.toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="sm:ml-2">
                        {confirmDeleteSaleId === s.id ? (
                          <div className="flex items-center gap-2">
                            {deleteSaleError && (
                              <span className="font-body text-xs text-red-400">{deleteSaleError}</span>
                            )}
                            <button
                              onClick={() => confirmDeleteSale(s)}
                              className="font-body text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-ink hover:opacity-90"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setConfirmDeleteSaleId(null)}
                              className="p-1.5 rounded-lg bg-hairline text-cream hover:bg-panel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isSaleRecent(s) ? (
                          <button
                            onClick={() => {
                              setConfirmDeleteSaleId(s.id)
                              setDeleteSaleError('')
                            }}
                            aria-label="Annuler cette vente"
                            className="p-1.5 rounded-md text-gold-dim hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span
                            title="Plus de 24h après l'enregistrement, cette vente ne peut plus être annulée."
                            className="p-1.5 inline-flex text-hairline cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5 opacity-40" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}