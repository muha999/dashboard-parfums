# Dashboard Parfums

Application de gestion de stock et de ventes pour une activité de vente de parfums : stock, ventes, gains, en un coup d'œil. Usage 100% local et personnel — pas de déploiement, pas de compte utilisateur multiple.

## Stack

- **Backend** — Django 6.1 + Django REST Framework + SQLite
- **Frontend** — React 19 + Vite + Tailwind CSS v4 + Recharts

## Structure du projet

```
dashboard-parfums/
├── backend/
│   ├── manage.py
│   ├── config/            réglages du projet (Django, CORS, media)
│   ├── parfums/           modèles, vues, serializers, admin
│   ├── db.sqlite3         la base de données
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx        composant principal (les 3 onglets)
│   │   ├── api.js         toutes les fonctions qui parlent au backend
│   │   └── index.css      Tailwind + polices + palette de couleurs
│   └── package.json
└── demarrer.bat           lance tout en un double-clic
```

## Premier démarrage (une seule fois)

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### Frontend

```
cd frontend
npm install
```

## Utilisation au quotidien

**Le plus simple** : double-clique sur `demarrer.bat`, à la racine du projet. Ça lance le backend et le frontend (minimisés dans la barre des tâches), et ouvre le dashboard dans une fenêtre Brave sans barre d'adresse.

**Manuellement**, si besoin :

```
# Fenêtre 1 — backend
cd backend
venv\Scripts\activate
python manage.py runserver

# Fenêtre 2 — frontend
cd frontend
npm run dev
```

Puis ouvre `http://localhost:5173`.

Pour tout arrêter : ferme les fenêtres (ou Ctrl+C dans chacune).

## Fonctionnalités

- **Stock** — ajouter, modifier (réapprovisionner), supprimer un parfum (nom, marque, photo, prix d'achat/vente, quantité). Badges "Stock bas" et "Épuisé" automatiques.
- **Vendu** — un clic ouvre un sélecteur de quantité, Confirmer déclenche la vente : décrémente le stock et calcule le gain, en une seule opération atomique côté serveur.
- **Aperçu** — gains totaux, chiffre d'affaires, valeur du stock, flacons en stock, graphique d'évolution des gains dans le temps.
- **Ventes** — historique complet, annulable dans les 24h suivant l'enregistrement (remet automatiquement le stock).
- **Admin Django** (`http://127.0.0.1:8000/admin`) — vue technique directe sur les données, utile pour du dépannage ou du nettoyage en masse.

## Référence API

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/parfums/` | Liste tous les parfums |
| POST | `/api/parfums/` | Crée un parfum |
| GET | `/api/parfums/<id>/` | Détail d'un parfum |
| PATCH | `/api/parfums/<id>/` | Modifie un parfum |
| DELETE | `/api/parfums/<id>/` | Supprime un parfum |
| POST | `/api/parfums/<id>/vendre/` | Enregistre une vente (`{"quantity": n}`) |
| GET | `/api/ventes/` | Liste toutes les ventes |
| DELETE | `/api/ventes/<id>/` | Annule une vente (bloqué après 24h) |

## Modèles de données

**Perfume** — `name`, `brand`, `image`, `buy_price`, `sell_price`, `stock`

**Sale** — `perfume` (lien, peut devenir vide si le parfum est supprimé), `perfume_name` et les prix figés au moment de la vente (pour un historique fiable même si les prix changent plus tard), `quantity`, `date`, `created_at`
