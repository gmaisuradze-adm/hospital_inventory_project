# Generated by Django 4.2.21 on 2025-05-26 09:12

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('inventory', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Request',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request_id', models.CharField(editable=False, help_text='Unique identifier for the request (e.g., REQ-YYYYMMDD-XXXX).', max_length=20, unique=True)),
                ('title', models.CharField(help_text='A brief title for the request.', max_length=255)),
                ('description', models.TextField(help_text='Detailed description of the request or issue.')),
                ('requested_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('PENDING', 'Pending Review'), ('OPEN', 'Open'), ('AWAITING_INFO', 'Awaiting User Information'), ('AWAITING_APPROVAL', 'Awaiting Approval'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('IN_PROGRESS', 'In Progress'), ('ON_HOLD', 'On Hold'), ('RESOLVED', 'Resolved'), ('CLOSED', 'Closed'), ('CANCELLED', 'Cancelled')], default='PENDING', max_length=20)),
                ('priority', models.CharField(choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('URGENT', 'Urgent')], default='MEDIUM', max_length=10)),
                ('resolution_details', models.TextField(blank=True, help_text='Details of how the request was resolved.', null=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('assigned_to', models.ForeignKey(blank=True, help_text='Staff member this request is assigned to.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_requests', to=settings.AUTH_USER_MODEL)),
                ('related_equipment', models.ForeignKey(blank=True, help_text='Specific equipment this request pertains to, if any.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='related_requests', to='inventory.equipment')),
            ],
            options={
                'verbose_name': 'IT Request',
                'verbose_name_plural': 'IT Requests',
                'ordering': ['-requested_at'],
            },
        ),
        migrations.CreateModel(
            name='RequestType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Type of request (e.g., New Equipment, Repair).', max_length=100, unique=True)),
                ('description', models.TextField(blank=True, help_text='Optional description of the request type.', null=True)),
            ],
            options={
                'verbose_name': 'Request Type',
                'verbose_name_plural': 'Request Types',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='RequestUpdate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('updated_at', models.DateTimeField(auto_now_add=True)),
                ('update_text', models.TextField(help_text='Details of the update, comment, or action taken.')),
                ('is_internal_note', models.BooleanField(default=False, help_text='If true, this note is only visible to staff.')),
                ('request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='updates', to='requests_app.request')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Request Update',
                'verbose_name_plural': 'Request Updates',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.AddField(
            model_name='request',
            name='request_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='requests', to='requests_app.requesttype'),
        ),
        migrations.AddField(
            model_name='request',
            name='requested_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submitted_requests', to=settings.AUTH_USER_MODEL),
        ),
    ]
