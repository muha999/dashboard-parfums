from django.db import models


class Perfume(models.Model):
    """Un parfum en stock, avec son prix d'achat et de vente."""

    name = models.CharField("nom", max_length=200)
    brand = models.CharField("marque", max_length=200, blank=True)
    image = models.ImageField("photo", upload_to="perfumes/", blank=True, null=True)
    buy_price = models.PositiveIntegerField("prix d'achat (FCFA)")
    sell_price = models.PositiveIntegerField("prix de vente (FCFA)")
    stock = models.PositiveIntegerField("stock", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "parfum"
        verbose_name_plural = "parfums"

    def __str__(self):
        return self.name

    @property
    def margin(self):
        """Marge unitaire en FCFA (prix de vente - prix d'achat)."""
        return self.sell_price - self.buy_price


class Sale(models.Model):
    """
    Une vente enregistrée. Le prix est figé au moment de la vente
    (unit_sell_price / unit_buy_price) pour que l'historique reste exact
    même si le prix du parfum change plus tard, ou si le parfum est supprimé.
    """

    perfume = models.ForeignKey(
        Perfume,
        verbose_name="parfum",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    perfume_name = models.CharField("nom du parfum", max_length=200)
    quantity = models.PositiveIntegerField("quantité")
    unit_sell_price = models.PositiveIntegerField("prix de vente unitaire (FCFA)")
    unit_buy_price = models.PositiveIntegerField("prix d'achat unitaire (FCFA)")
    date = models.DateField("date de vente")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "vente"
        verbose_name_plural = "ventes"

    def __str__(self):
        return f"{self.perfume_name} x{self.quantity} ({self.date})"

    @property
    def revenue(self):
        """Chiffre d'affaires généré par cette vente, en FCFA."""
        return self.unit_sell_price * self.quantity

    @property
    def gain(self):
        """Gain (marge) généré par cette vente, en FCFA."""
        return (self.unit_sell_price - self.unit_buy_price) * self.quantity
