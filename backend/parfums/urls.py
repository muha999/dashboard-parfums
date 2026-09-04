from django.urls import path

from . import views

urlpatterns = [
    path("parfums/", views.PerfumeListCreateView.as_view(), name="parfume-list-create"),
    path("parfums/<int:pk>/", views.PerfumeDetailView.as_view(), name="parfume-detail"),
    path("parfums/<int:pk>/vendre/", views.vendre_parfum, name="vendre-parfum"),
    path("ventes/", views.SaleListView.as_view(), name="sale-list"),
    path("ventes/<int:pk>/", views.SaleDetailView.as_view(), name="sale-detail"),
]
