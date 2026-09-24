from rest_framework import serializers

from .models import Perfume, Sale


class PerfumeSerializer(serializers.ModelSerializer):
    margin = serializers.ReadOnlyField()

    class Meta:
        model = Perfume
        fields = ["id", "name", "brand", "category", "image", "buy_price", "sell_price", "stock", "margin"]


class SaleSerializer(serializers.ModelSerializer):
    revenue = serializers.ReadOnlyField()
    gain = serializers.ReadOnlyField()

    class Meta:
        model = Sale
        fields = ["id", "perfume", "perfume_name", "category", "status", "customer_name", "customer_phone", "quantity", "unit_sell_price", "unit_buy_price", "date", "revenue", "gain", "created_at"]