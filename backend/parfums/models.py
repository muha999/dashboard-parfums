from django.db import models
from django.contrib.auth.models import User # <-- Ajoute cet import tout en haut


class Perfume(models.Model):
    """Un article en stock (parfum, chaussure, électronique...), avec son prix d'achat et de vente."""

    CATEGORY_CHOICES = [
        ("parfums", "Parfums"),
        ("chaussures", "Chaussures"),
        ("electronique", "Électronique"),
        ("autre", "Autre"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField("nom", max_length=200)
    brand = models.CharField("marque", max_length=200, blank=True)
    category = models.CharField(
        "catégorie", max_length=20, choices=CATEGORY_CHOICES, default="parfums"
    )
    image = models.ImageField("photo", upload_to="perfumes/", blank=True, null=True)
    buy_price = models.PositiveIntegerField("prix d'achat (FCFA)")
    sell_price = models.PositiveIntegerField("prix de vente (FCFA)")
    stock = models.PositiveIntegerField("stock", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "article"
        verbose_name_plural = "articles"

    def __str__(self):
        return self.name

    @property
    def margin(self):
        """Marge unitaire en FCFA (prix de vente - prix d'achat)."""
        return self.sell_price - self.buy_price


class Sale(models.Model):
    """
    Une vente. Le prix est figé au moment de la vente
    (unit_sell_price / unit_buy_price) pour que l'historique reste exact
    même si le prix du parfum change plus tard, ou si le parfum est supprimé.

    Une vente commence "en attente" (le stock n'a pas encore bougé) et ne
    devient "confirmée" (stock décrémenté, comptée dans les gains) que
    lorsque le client confirme avoir reçu son produit.
    """

    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("confirmed", "Confirmée"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    perfume = models.ForeignKey(
        Perfume,
        verbose_name="parfum",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    perfume_name = models.CharField("nom du parfum", max_length=200)
    category = models.CharField(
        "catégorie", max_length=20, choices=Perfume.CATEGORY_CHOICES, default="parfums"
    )
    status = models.CharField(
        "statut", max_length=10, choices=STATUS_CHOICES, default="confirmed"
    )
    customer_name = models.CharField("nom du client", max_length=200, blank=True)
    customer_phone = models.CharField("téléphone du client", max_length=30, blank=True)
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