from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Perfume, Sale
from .serializers import PerfumeSerializer, SaleSerializer


class PerfumeListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/parfums/  -> liste tous les parfums
    POST /api/parfums/  -> crée un nouveau parfum
    """

    queryset = Perfume.objects.all()
    serializer_class = PerfumeSerializer


class PerfumeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/parfums/<id>/  -> détail d'un parfum
    PATCH  /api/parfums/<id>/  -> modifie un parfum existant (ex: réapprovisionner le stock, changer un prix)
    DELETE /api/parfums/<id>/  -> supprime un parfum (son historique de ventes reste intact)
    """

    queryset = Perfume.objects.all()
    serializer_class = PerfumeSerializer


class SaleListView(generics.ListAPIView):
    """GET /api/ventes/ -> liste toutes les ventes (lecture seule)."""

    queryset = Sale.objects.all()
    serializer_class = SaleSerializer


class SaleDetailView(generics.DestroyAPIView):
    """
    DELETE /api/ventes/<id>/ -> supprime une vente enregistrée par erreur
    et remet la quantité correspondante dans le stock du parfum
    (si le parfum existe encore). Bloqué au-delà de 24h après l'enregistrement.
    """

    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if timezone.now() - instance.created_at > timedelta(hours=24):
            return Response(
                {"error": "Cette vente a plus de 24h, elle ne peut plus être annulée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        with transaction.atomic():
            if instance.perfume:
                instance.perfume.stock += instance.quantity
                instance.perfume.save()
            instance.delete()


@api_view(["POST"])
def vendre_parfum(request, pk):
    """
    Enregistre une vente pour ce parfum : décrémente le stock et
    crée la ligne de vente correspondante, dans une seule transaction
    atomique (les deux réussissent ensemble, ou aucun des deux).

    Attendu en entrée (JSON) : {"quantity": 2}
    """
    perfume = get_object_or_404(Perfume, pk=pk)

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

    with transaction.atomic():
        perfume.stock -= quantity
        perfume.save()
        sale = Sale.objects.create(
            perfume=perfume,
            perfume_name=perfume.name,
            quantity=quantity,
            unit_sell_price=perfume.sell_price,
            unit_buy_price=perfume.buy_price,
            date=timezone.localdate(),
        )

    return Response(
        {
            "sale_id": sale.id,
            "perfume_id": perfume.id,
            "new_stock": perfume.stock,
            "quantity": sale.quantity,
            "revenue": sale.revenue,
            "gain": sale.gain,
            "date": sale.date,
        },
        status=status.HTTP_201_CREATED,
    )
