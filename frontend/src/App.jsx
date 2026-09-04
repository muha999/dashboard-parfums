import { useState, useEffect } from 'react'
import { Sparkles, Droplet, Check, X, Pencil, Trash2, Wallet, Package } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createPerfume, updatePerfume, deletePerfume, listPerfumes, listSales, sellPerfume, deleteSale } from './api'

const tabs = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'stock', label: 'Stock' },
  { id: 'ventes', label: 'Ventes' },
]

const emptyForm = { name: '', brand: '', buyPrice: '', sellPrice: '', stock: '' }

export default function App() {
  const [tab, setTab] = useState('apercu')

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

  const totalGain = sales.reduce((sum, s) => sum + s.gain, 0)
  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0)
  const stockValue = perfumes.reduce((sum, p) => sum + p.stock * p.buy_price, 0)
  const stockUnits = perfumes.reduce((sum, p) => sum + p.stock, 0)

  const chartData = (() => {
    if (sales.length === 0) return []
    const byDate = {}
    sales.forEach((s) => {
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
  }

  async function confirmSell(perfume) {
    setSellError('')
    try {
      await sellPerfume(perfume.id, sellQuantity)
      setSellingId(null)
      refreshPerfumes()
      refreshSales()
    } catch (err) {
      setSellError(err.message)
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

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-16 text-cream">
        <div className="mb-10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-gold" />
            <h1 className="font-display text-4xl sm:text-5xl text-cream">Mon Comptoir à Parfums</h1>
          </div>
          <p className="font-body text-base text-gold-dim mt-2">Stock, ventes et gains, en un coup d'œil.</p>
        </div>

        <div className="inline-flex bg-panel rounded-lg p-1.5 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-body px-6 py-3 rounded-md text-base font-medium transition-colors"
              style={{
                backgroundColor: tab === t.id ? '#26201a' : 'transparent',
                color: tab === t.id ? '#d4af6a' : '#8a7c62',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-panel rounded-2xl p-6 sm:p-10 border border-hairline">
          {tab === 'apercu' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex justify-center lg:justify-start mb-6">
                  <div className="w-36 h-16 rounded-full bg-panel-2 border-2 border-gold flex flex-col items-center justify-center">
                    <span className="font-body text-gold text-xs uppercase tracking-widest">Gains totaux</span>
                    <span className="font-display text-cream text-base">{totalGain.toLocaleString('fr-FR')} FCFA</span>
                  </div>
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
                            <stop offset="5%" stopColor="#d4af6a" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#d4af6a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3a3226" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          tick={{ fontSize: 12, fill: '#8a7c62' }}
                          axisLine={{ stroke: '#3a3226' }}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => (v < 1000 ? v : Math.round(v / 1000) + 'k')}
                          tick={{ fontSize: 12, fill: '#8a7c62' }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          formatter={(v) => [v.toLocaleString('fr-FR') + ' FCFA', 'Gains cumulés']}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          contentStyle={{ background: '#211c17', border: '1px solid #3a3226', borderRadius: 8, fontSize: 13, color: '#f2e8d5' }}
                        />
                        <Area type="monotone" dataKey="gains" stroke="#d4af6a" strokeWidth={2} fill="url(#goldGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ) : tab === 'stock' ? (
            <div>
              {successMsg && (
                <div className="font-body mb-6 px-4 py-3 rounded-lg bg-panel-2 border border-gold text-gold text-sm">
                  {successMsg}
                </div>
              )}

              {!showForm && (
                <button
                  onClick={openAddForm}
                  className="font-body mb-8 px-5 py-2.5 rounded-lg bg-gold text-ink text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  + Ajouter un parfum
                </button>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} className="bg-panel-2 border border-hairline rounded-xl p-8 mb-8">
                  <p className="font-display text-xl text-cream mb-5">
                    {editingId ? 'Modifier ce parfum' : 'Nouveau parfum'}
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
              ) : perfumes.length === 0 ? (
                <p className="font-body text-base text-gold-dim">
                  Aucun parfum pour l'instant — ajoute le premier avec le bouton ci-dessus.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {perfumes.map((p) => (
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
                            style={{ backgroundColor: 'rgba(23,20,18,0.85)' }}
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
                            style={{ backgroundColor: 'rgba(23,20,18,0.85)' }}
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
                          <span className="font-body text-xs px-2 py-0.5 rounded-full border border-gold text-gold flex-shrink-0">
                            Stock bas
                          </span>
                        )}
                      </div>
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
                            <button
                              type="button"
                              onClick={() => setSellQuantity((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-md bg-hairline text-cream hover:bg-panel"
                            >
                              −
                            </button>
                            <span className="font-money text-base w-6 text-center text-cream">{sellQuantity}</span>
                            <button
                              type="button"
                              onClick={() => setSellQuantity((q) => Math.min(p.stock, q + 1))}
                              className="w-8 h-8 rounded-md bg-hairline text-cream hover:bg-panel"
                            >
                              +
                            </button>
                          </div>
                          {sellError && <p className="font-body text-xs text-red-400 mb-2">{sellError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmSell(p)}
                              className="font-body flex-1 text-sm font-semibold py-2 rounded-lg bg-gold text-ink hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4" /> Confirmer
                            </button>
                            <button
                              onClick={() => setSellingId(null)}
                              className="px-3 py-2 rounded-lg bg-hairline text-cream hover:bg-panel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          disabled={p.stock === 0}
                          onClick={() => startSell(p)}
                          className="font-body w-full text-sm font-medium py-2 rounded-lg border border-gold text-gold hover:bg-panel disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Vendu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {sales.length === 0 ? (
                <p className="font-body text-base text-gold-dim">Aucune vente enregistrée pour l'instant.</p>
              ) : (
                <div className="divide-y divide-hairline">
                  {sales.map((s) => (
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
