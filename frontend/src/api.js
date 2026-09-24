const API_URL = 'https://dashboard-parfums-api-muha999.onrender.com'

// Fonction pour récupérer le token et préparer les en-têtes (headers)
function getAuthHeaders(isFormData = false) {
  // Remplace 'access' par 'token' si c'est sous ce nom que tu l'as sauvegardé dans ton Login.jsx
  const token = localStorage.getItem('access_token');
  const headers = {};

  if (token) {
    // Remplace 'Bearer' par 'Token' si tu utilises l'authentification standard DRF au lieu de JWT
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Le navigateur gère tout seul le Content-Type pour les envois de fichiers (FormData)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function listPerfumes() {
  const res = await fetch(`${API_URL}/parfums/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Impossible de charger tes parfums.')
  return res.json()
}

export async function listSales() {
  const res = await fetch(`${API_URL}/ventes/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Impossible de charger tes ventes.')
  return res.json()
}

export async function createPerfume(formData) {
  const res = await fetch(`${API_URL}/parfums/`, { 
    method: 'POST', 
    headers: getAuthHeaders(true), // true car c'est un FormData (photo potentiellement incluse)
    body: formData 
  })
  const data = await res.json()
  if (!res.ok) throw new Error(Object.values(data).flat().join(' '))
  return data
}

export async function updatePerfume(id, formData) {
  const res = await fetch(`${API_URL}/parfums/${id}/`, { 
    method: 'PATCH', 
    headers: getAuthHeaders(true),
    body: formData 
  })
  const data = await res.json()
  if (!res.ok) throw new Error(Object.values(data).flat().join(' '))
  return data
}

export async function deleteSale(id) {
  const res = await fetch(`${API_URL}/ventes/${id}/`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Impossible d'annuler cette vente.")
  }
}

export async function deletePerfume(id) {
  const res = await fetch(`${API_URL}/parfums/${id}/`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Impossible de supprimer ce parfum.')
}

export async function sellPerfume(id, quantity, customerName, customerPhone) {
  const res = await fetch(`${API_URL}/parfums/${id}/vendre/`, {
    method: 'POST',
    headers: getAuthHeaders(), // Pas de true ici car on envoie du JSON classique
    body: JSON.stringify({ quantity, customer_name: customerName, customer_phone: customerPhone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer la vente.")
  return data
}

export async function confirmSale(id) {
  const res = await fetch(`${API_URL}/ventes/${id}/confirmer/`, { 
    method: 'POST',
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Impossible de confirmer cette vente.')
  return data
}