from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.contrib.auth.models import User

# Création automatique du compte administrateur au démarrage
# Création automatique des comptes au démarrage
try:
    # Le compte de ta mère
    if not User.objects.filter(username='Maman').exists():
        User.objects.create_superuser('Maman', 'lomouha260@gmail.com', 'Awalo1977')
        print("Compte Maman créé avec succès !")
        
    # Un autre compte (tu peux modifier le nom et le mot de passe)
    if not User.objects.filter(username='Vendeur').exists():
        User.objects.create_superuser('Mouha_lo', 'lomouha250@gmail.com.com', '2010qwer')
        print("Compte Vendeur créé avec succès !")
except Exception:
    pass

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('parfums.urls')),
    
    # Routes pour la connexion et le rafraîchissement du jeton
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]