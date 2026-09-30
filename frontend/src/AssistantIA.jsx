import React, { useState } from 'react';

export default function AssistantIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [requete, setRequete] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Bonjour ! Je suis ton assistant. Que veux-tu gérer aujourd\'hui ?' }
  ]);

  const soumettreRequete = async (e) => {
    e.preventDefault();
    if (!requete.trim()) return;

    // 1. Afficher ton message immédiatement dans le chat
    const userText = requete;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setRequete('');

    try {
      // 2. Envoyer le message à ton serveur Django avec l'authentification
      const token = localStorage.getItem('access_token');
      const res = await fetch('https://dashboard-parfums-muha999.onrender.com/api/assistant/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await res.json();

      if (res.ok) {
        // 3. Afficher la vraie réponse de l'IA (Groq) dans le chat
        setMessages((prev) => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', text: "Erreur : " + (data.error || "Impossible de joindre l'assistant.") }]);
      }

    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: "Erreur de connexion au serveur." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden mb-4">
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <h3 className="text-white font-bold flex items-center gap-2">✨ Assistant Virtuel</h3>
          </div>
          
          <div className="p-4 h-64 overflow-y-auto flex flex-col gap-3 bg-[#121212]">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg text-sm max-w-[85%] ${
                  msg.role === 'ai' 
                    ? 'bg-gray-800 text-gray-200 self-start' 
                    : 'bg-[#4ade80] text-gray-900 self-end font-medium'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={soumettreRequete} className="p-3 bg-gray-800 border-t border-gray-700 flex">
            <input 
              type="text" 
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              placeholder="Tape une commande..." 
              className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-l-lg outline-none text-sm border border-gray-700 focus:border-[#4ade80]"
            />
            <button 
              type="submit" 
              className="bg-[#4ade80] px-4 text-gray-900 font-bold rounded-r-lg hover:bg-green-500 transition-colors"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Bouton d'ouverture/fermeture */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#4ade80] rounded-full flex items-center justify-center text-gray-900 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:bg-green-500 transition-all text-2xl"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}