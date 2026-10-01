import { supabase } from './supabaseClient'

// 1. Lister tous les articles (toutes catégories confondues)
export async function listPerfumes() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data
}

// 2. Lister les ventes (avec jointure automatique pour avoir le nom de l'article)
export async function listSales() {
  const { data, error } = await supabase
    .from('ventes')
    .select(`*, articles(*)`)
    .order('created_at', { ascending: false })
    
  if (error) throw new Error(error.message)
  return data
}

// 3. Ajouter un produit (Transforme automatiquement ton FormData)
export async function createPerfume(formData) {
  // On convertit le FormData de React en objet simple pour Supabase
  const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData
  
  // Si aucune catégorie n'est précisée par défaut dans ton formulaire
  if (!rawData.categorie) rawData.categorie = 'Parfums'

  const { data, error } = await supabase
    .from('articles')
    .insert([rawData])
    .select()

  if (error) throw new Error(error.message)
  return data[0]
}

// 4. Modifier un produit
export async function updatePerfume(id, formData) {
  const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData
  
  const { data, error } = await supabase
    .from('articles')
    .update(rawData)
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)
  return data[0]
}

// 5. Supprimer une vente
export async function deleteSale(id) {
  const { error } = await supabase
    .from('ventes')
    .delete()
    .eq('id', id)
    
  if (error) throw new Error("Impossible d'annuler cette vente.")
}

// 6. Supprimer un produit
export async function deletePerfume(id) {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    
  if (error) throw new Error('Impossible de supprimer cet article.')
}

// 7. Enregistrer une vente et déduire le stock
export async function sellPerfume(id, quantity, customerName, customerPhone) {
  // A. Récupérer le prix de l'article et vérifier le stock
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
    
  if (fetchError) throw new Error(fetchError.message)
  if (article.stock < quantity) throw new Error("Stock insuffisant.")

  const prix_total = article.prix * quantity

  // B. Insérer la vente
  const { data: sale, error: saleError } = await supabase
    .from('ventes')
    .insert([{
      article_id: id,
      quantite: quantity,
      prix_total: prix_total
      // NB: customer_name et customer_phone ne sont pas encore dans la DB
    }])
    .select()
    
  if (saleError) throw new Error(saleError.message)

  // C. Mettre à jour le stock
  const { error: stockError } = await supabase
    .from('articles')
    .update({ stock: article.stock - quantity })
    .eq('id', id)
    
  if (stockError) throw new Error(stockError.message)

  return sale[0]
}

// 8. Confirmer une vente (Bouchon en attendant d'ajouter un statut)
export async function confirmSale(id) {
  // Dans ton ancienne app, cela validait les ventes "En attente". 
  // On y reviendra plus tard en ajoutant une colonne "statut" dans la table ventes.
  return { success: true }
}