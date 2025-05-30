# Generated by Django 4.2.21 on 2025-05-26 14:16

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('inventory', '0002_category_status_alter_equipment_options_and_more'),
        ('requests_app', '0002_alter_request_options_alter_requesttype_options_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='request',
            options={'ordering': ['-created_at'], 'verbose_name': 'IT Equipment Request', 'verbose_name_plural': 'IT Equipment Requests'},
        ),
        migrations.AlterModelOptions(
            name='requestupdate',
            options={'ordering': ['-update_time'], 'verbose_name': 'Request Update Log', 'verbose_name_plural': 'Request Update Logs'},
        ),
        migrations.AddField(
            model_name='request',
            name='date_assigned',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Date Assigned'),
        ),
        migrations.AddField(
            model_name='request',
            name='department_location',
            field=models.CharField(blank=True, help_text='Department or location requiring the equipment.', max_length=150),
        ),
        migrations.AddField(
            model_name='request',
            name='desired_completion_date',
            field=models.DateField(blank=True, help_text='Desired completion date (deadline).', null=True),
        ),
        migrations.AlterField(
            model_name='request',
            name='assigned_to',
            field=models.ForeignKey(blank=True, limit_choices_to={'is_staff': True}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_requests', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='request',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now, verbose_name='Date Submitted'),
        ),
        migrations.AlterField(
            model_name='request',
            name='description',
            field=models.TextField(help_text='Detailed description of the request or reason for request.'),
        ),
        migrations.AlterField(
            model_name='request',
            name='related_equipment',
            field=models.ForeignKey(blank=True, help_text='Select if this request is for an existing piece of equipment (e.g., upgrade/repair).', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='maintenance_requests', to='inventory.equipment'),
        ),
        migrations.AlterField(
            model_name='request',
            name='resolution_notes',
            field=models.TextField(blank=True, help_text='Notes on how the request was resolved or why it was rejected.', null=True),
        ),
        migrations.AlterField(
            model_name='request',
            name='resolved_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Date Completed/Resolved'),
        ),
        migrations.AlterField(
            model_name='request',
            name='status',
            field=models.CharField(choices=[('new', 'New'), ('assigned', 'Assigned'), ('pending_order', 'Pending Order'), ('completed', 'Completed'), ('rejected', 'Rejected'), ('on_hold', 'On Hold')], default='new', max_length=20),
        ),
        migrations.AlterField(
            model_name='request',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, verbose_name='Last Updated'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='new_status',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='old_status',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
