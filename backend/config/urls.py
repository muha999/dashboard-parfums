from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.contrib.auth.models import User

# Création automatique du compte administrateur au démarrage
try:
    if not User.objects.filter(username='Maman').exists():
        User.objects.create_superuser('Maman', 'maman@test.com', 'MotDePasse123!')
        print("Compte Maman créé avec succès !")
except Exception:
    pass

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('parfums.urls')),
    
    # Routes pour la connexion et le rafraîchissement du jeton
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]