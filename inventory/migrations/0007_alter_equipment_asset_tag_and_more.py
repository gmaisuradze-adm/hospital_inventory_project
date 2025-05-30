# Generated by Django 4.2.21 on 2025-05-28 08:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0006_alter_stockitem_category_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='equipment',
            name='asset_tag',
            field=models.CharField(blank=True, editable=False, help_text='ორგანიზაციის შიდა უნიკალური საინვენტარო ნომერი (ავტომატურად გენერირდება).', max_length=50, unique=True, verbose_name='Asset Tag (Internal ID)'),
        ),
        migrations.AlterField(
            model_name='equipmentlog',
            name='change_type',
            field=models.CharField(choices=[('created', 'Created'), ('updated', 'Updated'), ('field_change', 'Field Changed'), ('status_changed', 'Status Changed'), ('location_changed', 'Location Changed'), ('assigned', 'Assigned/Unassigned'), ('decommissioned', 'Decommissioned'), ('archived', 'Archived'), ('notes_added', 'Notes Added/Changed'), ('maintenance_log', 'Maintenance Logged'), ('warranty_updated', 'Warranty Info Updated'), ('other', 'Other')], default='updated', max_length=20, verbose_name='Type of Change'),
        ),
    ]
