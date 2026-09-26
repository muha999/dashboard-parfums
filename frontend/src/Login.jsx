import { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://dashboard-parfums-muha999.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
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