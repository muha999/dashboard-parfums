from django.contrib import admin

from .models import Perfume, Sale


@admin.register(Perfume)
class PerfumeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "brand", "buy_price", "sell_price", "margin", "stock")
    search_fields = ("name", "brand")
    list_filter = ("category", "brand")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("perfume_name", "quantity", "unit_sell_price", "date", "revenue", "gain")
    list_filter = ("date",)
    search_fields = ("perfume_name",)
    date_hierarchy = "date"
