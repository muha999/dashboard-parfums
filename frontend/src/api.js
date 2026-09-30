const API_URL = 'https://dashboard-parfums-muha999.onrender.com/api'

// Fonction pour récupérer le token et préparer les en-têtes (headers)
function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('access_token');
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

// 🛡️ LE NOUVEAU "SUPER FETCH" : Gère le renouvellement invisible et les déconnexions propres
async function fetchWithAuth(url, options = {}) {
  let res = await fetch(url, options);

  // Si le token est expiré (Erreur 401 de Django)
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        // 1. Tenter de récupérer un nouveau pass (vérifie que ton URL côté Django est bien /token/refresh/)
        const refreshRes = await fetch(`${API_URL}/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          // Sauvegarder le nouveau pass
          localStorage.setItem('access_token', data.access);
          
          // Mettre à jour la requête bloquée avec la nouvelle clé
          if (options.headers) {
            options.headers['Authorization'] = `Bearer ${data.access}`;
          }
          
          // Relancer l'action (ex: ajouter le parfum) qui avait échoué
          return await fetch(url, options);
        }
      } catch (error) {
        console.error("Impossible de rafraîchir la session", error);
      }
    }

    // 2. Si le rafraîchissement échoue, on nettoie tout et on renvoie au Login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload(); 
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  return res;
}


// --- MODIFICATION : On utilise fetchWithAuth au lieu de fetch classique ---

export async function listPerfumes() {
  const res = await fetchWithAuth(`${API_URL}/parfums/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Impossible de charger tes parfums.')
  return res.json()
}

export async function listSales() {
  const res = await fetchWithAuth(`${API_URL}/ventes/`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Impossible de charger tes ventes.')
  return res.json()
}

export async function createPerfume(formData) {
  const res = await fetchWithAuth(`${API_URL}/parfums/`, { 
    method: 'POST', 
    headers: getAuthHeaders(true),
    body: formData 
  })
  const data = await res.json()
  if (!res.ok) {
    // 🛠️ CORRECTION DU [object Object] : On extrait l'erreur proprement
    const errorMessage = data.detail || data.error || "Erreur lors de l'ajout.";
    throw new Error(errorMessage);
  }
  return data
}

export async function updatePerfume(id, formData) {
  const res = await fetchWithAuth(`${API_URL}/parfums/${id}/`, { 
    method: 'PATCH', 
    headers: getAuthHeaders(true),
    body: formData 
  })
  const data = await res.json()
  if (!res.ok) {
    const errorMessage = data.detail || data.error || "Erreur lors de la modification.";
    throw new Error(errorMessage);
  }
  return data
}

export async function deleteSale(id) {
  const res = await fetchWithAuth(`${API_URL}/ventes/${id}/`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Impossible d'annuler cette vente.")
  }
}

export async function deletePerfume(id) {
  const res = await fetchWithAuth(`${API_URL}/parfums/${id}/`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Impossible de supprimer ce parfum.')
}

export async function sellPerfume(id, quantity, customerName, customerPhone) {
  const res = await fetchWithAuth(`${API_URL}/parfums/${id}/vendre/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity, customer_name: customerName, customer_phone: customerPhone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer la vente.")
  return data
}

export async function confirmSale(id) {
  const res = await fetchWithAuth(`${API_URL}/ventes/${id}/confirmer/`, { 
    method: 'POST',
    headers: getAuthHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Impossible de confirmer cette vente.')
  return data
}