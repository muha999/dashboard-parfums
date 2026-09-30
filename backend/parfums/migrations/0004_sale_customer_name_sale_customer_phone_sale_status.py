from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parfums', '0003_sale_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='sale',
            name='customer_name',
            field=models.CharField(blank=True, max_length=200, verbose_name='nom du client'),
        ),
        migrations.AddField(
            model_name='sale',
            name='customer_phone',
            field=models.CharField(blank=True, max_length=30, verbose_name='téléphone du client'),
        ),
        migrations.AddField(
            model_name='sale',
            name='status',
            field=models.CharField(choices=[('pending', 'En attente'), ('confirmed', 'Confirmée')], default='confirmed', max_length=10, verbose_name='statut'),
        ),
    ]