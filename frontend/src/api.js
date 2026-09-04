const API_URL = 'http://127.0.0.1:8000/api'

export async function listPerfumes() {
  const res = await fetch(`${API_URL}/parfums/`)
  if (!res.ok) throw new Error('Impossible de charger tes parfums.')
  return res.json()
}

export async function listSales() {
  const res = await fetch(`${API_URL}/ventes/`)
  if (!res.ok) throw new Error('Impossible de charger tes ventes.')
  return res.json()
}

export async function createPerfume(formData) {
  const res = await fetch(`${API_URL}/parfums/`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) {
    // DRF renvoie les erreurs par champ, ex: {"sell_price": ["Ce champ est obligatoire."]}
    throw new Error(Object.values(data).flat().join(' '))
  }
  return data
}

export async function updatePerfume(id, formData) {
  const res = await fetch(`${API_URL}/parfums/${id}/`, {
    method: 'PATCH',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(Object.values(data).flat().join(' '))
  }
  return data
}

export async function deleteSale(id) {
  const res = await fetch(`${API_URL}/ventes/${id}/`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Impossible d'annuler cette vente.")
  }
}

export async function deletePerfume(id) {
  const res = await fetch(`${API_URL}/parfums/${id}/`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error('Impossible de supprimer ce parfum.')
  }
}

export async function sellPerfume(id, quantity) {
  const res = await fetch(`${API_URL}/parfums/${id}/vendre/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Impossible d'enregistrer la vente.")
  }
  return data
}
