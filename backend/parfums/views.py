from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes # Ajout de permission_classes ici
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Perfume, Sale
from .serializers import PerfumeSerializer, SaleSerializer


class PerfumeListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/parfums/  -> liste tous les parfums DE L'UTILISATEUR CONNECTÉ
    POST /api/parfums/  -> crée un nouveau parfum POUR L'UTILISATEUR CONNECTÉ
    """
    serializer_class = PerfumeSerializer
    permission_classes = [IsAuthenticated]

    # Ne renvoie que les parfums du compte actuellement connecté
    def get_queryset(self):
        return Perfume.objects.filter(user=self.request.user)

    # Lie automatiquement le nouveau parfum au compte connecté
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PerfumeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/parfums/<id>/  -> détail d'un parfum
    PATCH  /api/parfums/<id>/  -> modifie un parfum existant
    DELETE /api/parfums/<id>/  -> supprime un parfum
    """
    serializer_class = PerfumeSerializer
    permission_classes = [IsAuthenticated]

    # Sécurité : On ne peut modifier/supprimer que SES propres parfums
    def get_queryset(self):
        return Perfume.objects.filter(user=self.request.user)


class SaleListView(generics.ListAPIView):
    """GET /api/ventes/ -> liste toutes les ventes DE L'UTILISATEUR CONNECTÉ"""
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    # Ne renvoie que les ventes du compte connecté
    def get_queryset(self):
        return Sale.objects.filter(user=self.request.user)


class SaleDetailView(generics.DestroyAPIView):
    """
    DELETE /api/ventes/<id>/ -> annule/supprime une vente.
    """
    permission_classes = [IsAuthenticated]

    # Sécurité : On ne peut annuler que SES propres ventes
    def get_queryset(self):
        return Sale.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == "confirmed" and timezone.now() - instance.created_at > timedelta(hours=24):
            return Response(
                {"error": "Cette vente a plus de 24h, elle ne peut plus être annulée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        with transaction.atomic():
            if instance.status == "confirmed" and instance.perfume:
                instance.perfume.stock += instance.quantity
                instance.perfume.save()
            instance.delete()


@api_view(["POST"])
@permission_classes([IsAuthenticated]) # Sécurisation de la fonction
def vendre_parfum(request, pk):
    """
    Crée une vente "en attente" pour ce parfum.
    """
    # On s'assure que le parfum appartient bien à la personne connectée
    perfume = get_object_or_404(Perfume, pk=pk, user=request.user)

    try:
        quantity = int(request.data.get("quantity"))
    except (TypeError, ValueError):
        return Response(
            {"error": "quantity doit être un nombre entier."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if quantity < 1:
        return Response(
            {"error": "quantity doit être au moins 1."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if quantity > perfume.stock:
        return Response(
            {"error": f"Stock insuffisant : il reste {perfume.stock} en stock."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    customer_name = (request.data.get("customer_name") or "").strip()
    if not customer_name:
        return Response(
            {"error": "Le nom du client est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    customer_phone = (request.data.get("customer_phone") or "").strip()

    sale = Sale.objects.create(
        user=request.user, # Lie la vente au compte connecté
        perfume=perfume,
        perfume_name=perfume.name,
        category=perfume.category,
        status="pending",
        customer_name=customer_name,
        customer_phone=customer_phone,
        quantity=quantity,
        unit_sell_price=perfume.sell_price,
        unit_buy_price=perfume.buy_price,
        date=timezone.localdate(),
    )

    return Response(
        {
            "sale_id": sale.id,
            "perfume_id": perfume.id,
            "status": sale.status,
            "customer_name": sale.customer_name,
            "quantity": sale.quantity,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated]) # Sécurisation de la fonction
def confirmer_vente(request, pk):
    """
    Confirme une vente en attente.
    """
    # On s'assure que la vente appartient bien à la personne connectée
    sale = get_object_or_404(Sale, pk=pk, user=request.user)

    if sale.status != "pending":
        return Response(
            {"error": "Cette vente n'est plus en attente."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not sale.perfume:
        return Response(
            {"error": "Le parfum associé a été supprimé, impossible de confirmer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if sale.quantity > sale.perfume.stock:
        return Response(
            {"error": f"Stock insuffisant : il reste {sale.perfume.stock} en stock."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        sale.perfume.stock -= sale.quantity
        sale.perfume.save()
        sale.status = "confirmed"
        sale.date = timezone.localdate()
        sale.save()

    return Response(
        {
            "sale_id": sale.id,
            "new_stock": sale.perfume.stock,
            "status": sale.status,
            "revenue": sale.revenue,
            "gain": sale.gain,
        },
        status=status.HTTP_200_OK,
    )