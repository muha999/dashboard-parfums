import { useState, useEffect } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [comptesSauvegardes, setComptesSauvegardes] = useState([]);

  // Récupère les comptes au chargement
  useEffect(() => {
    const comptes = JSON.parse(localStorage.getItem('profils_boutique')) || [];
    setComptesSauvegardes(comptes);
  }, []);

  // Fonction quand on clique sur un profil
  const selectionnerCompte = (compte) => {
    setUsername(compte.username);
    setPassword(compte.password);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://dashboard-parfums-muha999.onrender.com/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // --- NOUVEAU CODE POUR SAUVEGARDER LE PROFIL ---
      const nouveauCompte = { username: username, password: password };
      const profilsExistants = comptesSauvegardes.filter(c => c.username !== username);
      const nouveauxProfils = [...profilsExistants, nouveauCompte];
      
      setComptesSauvegardes(nouveauxProfils);
      localStorage.setItem('profils_boutique', JSON.stringify(nouveauxProfils));
      // -----------------------------------------------
        onLoginSuccess();
      } else {
        setError('Identifiants incorrects.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="bg-panel border border-hairline p-8 rounded-2xl w-full max-w-sm shadow-2xl">
        <h2 className="font-display text-3xl text-cream mb-6 text-center">Connexion</h2>
        
        {error && <p className="text-red-400 text-center mb-4 text-sm font-body">{error}</p>}
        {/* --- AFFICHAGE DES PROFILS SAUVEGARDÉS --- */}
      {comptesSauvegardes.length > 0 && (
        <div className="mb-6 flex gap-4 justify-center">
          {comptesSauvegardes.map((compte, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectionnerCompte(compte)}
              className="flex flex-col items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 shadow-lg"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 uppercase">
                {compte.username.charAt(0)}
              </div>
              <span className="text-white text-sm capitalize">{compte.username}</span>
            </button>
          ))}
        </div>
      )}
      {/* --------------------------------------- */}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
           <label className="block text-gold-dim font-body mb-1.5 text-sm">Nom d'utilisateur ou Téléphone</label>
            <input 
              type="text" 
              className="w-full bg-ink border border-hairline text-cream rounded-lg p-2.5 focus:outline-none focus:border-gold transition-colors font-body"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-gold-dim font-body mb-1.5 text-sm">Mot de passe</label>
            <input 
              type="password" 
              className="w-full bg-ink border border-hairline text-cream rounded-lg p-2.5 focus:outline-none focus:border-gold transition-colors font-body"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full mt-2 py-3 rounded-full bg-panel border border-hairline text-gold-dim hover:text-cream hover:border-gold transition-all duration-300 font-body"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}