# Generated by Django 4.2.21 on 2025-05-27 07:23

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('inventory', '0004_alter_category_options_alter_location_options_and_more'),
        ('requests_app', '0003_alter_request_options_alter_requestupdate_options_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='request',
            options={'ordering': ['-created_at'], 'permissions': [('can_assign_request', 'Can assign IT requests to staff'), ('can_change_request_status', 'Can change status of IT requests')], 'verbose_name': 'IT Equipment Request', 'verbose_name_plural': 'IT Equipment Requests'},
        ),
        migrations.AlterModelOptions(
            name='requesttype',
            options={'ordering': ['name'], 'verbose_name': 'Request Type', 'verbose_name_plural': 'Request Types'},
        ),
        migrations.AlterField(
            model_name='request',
            name='assigned_to',
            field=models.ForeignKey(blank=True, help_text='IT staff member responsible for handling this request.', limit_choices_to={'is_staff': True}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_requests', to=settings.AUTH_USER_MODEL, verbose_name='Assigned To (IT Staff)'),
        ),
        migrations.AlterField(
            model_name='request',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='Date Submitted'),
        ),
        migrations.AlterField(
            model_name='request',
            name='date_assigned',
            field=models.DateTimeField(blank=True, editable=False, help_text='Date and time when the request was assigned to an IT staff member.', null=True, verbose_name='Date Assigned'),
        ),
        migrations.AlterField(
            model_name='request',
            name='department_location',
            field=models.CharField(blank=True, help_text='Specify the department or physical location this request is for (e.g., Cardiology Dept, Room 301).', max_length=150, null=True, verbose_name='Department / Location for Request'),
        ),
        migrations.AlterField(
            model_name='request',
            name='description',
            field=models.TextField(help_text='Provide a full description of the issue, need, or reason for the request.', verbose_name='Detailed Description'),
        ),
        migrations.AlterField(
            model_name='request',
            name='desired_completion_date',
            field=models.DateField(blank=True, help_text='If you have a preferred deadline for this request, please indicate it.', null=True, verbose_name='Desired Completion Date (Optional)'),
        ),
        migrations.AlterField(
            model_name='request',
            name='priority',
            field=models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', help_text='Set the urgency of this request.', max_length=20, verbose_name='Priority'),
        ),
        migrations.AlterField(
            model_name='request',
            name='related_equipment',
            field=models.ForeignKey(blank=True, help_text='If this request pertains to a specific piece of existing equipment, select it here.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='maintenance_requests', to='inventory.equipment', verbose_name='Related Equipment (Optional)'),
        ),
        migrations.AlterField(
            model_name='request',
            name='request_type',
            field=models.ForeignKey(blank=True, help_text='Select the category that best fits your request.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='requests', to='requests_app.requesttype', verbose_name='Request Type'),
        ),
        migrations.AlterField(
            model_name='request',
            name='requested_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submitted_requests', to=settings.AUTH_USER_MODEL, verbose_name='Requested By'),
        ),
        migrations.AlterField(
            model_name='request',
            name='resolution_notes',
            field=models.TextField(blank=True, help_text='Internal notes from IT staff on how the request was resolved, or reasons for rejection/hold.', null=True, verbose_name='Resolution Notes'),
        ),
        migrations.AlterField(
            model_name='request',
            name='resolved_at',
            field=models.DateTimeField(blank=True, editable=False, help_text='Date and time when the request was marked as completed or rejected.', null=True, verbose_name='Date Completed/Resolved'),
        ),
        migrations.AlterField(
            model_name='request',
            name='status',
            field=models.CharField(choices=[('new', 'New'), ('assigned', 'Assigned'), ('pending_order', 'Pending Order'), ('completed', 'Completed'), ('rejected', 'Rejected'), ('on_hold', 'On Hold')], default='new', help_text='Current status of the request.', max_length=20, verbose_name='Status'),
        ),
        migrations.AlterField(
            model_name='request',
            name='subject',
            field=models.CharField(help_text='A brief summary of the request.', max_length=255, verbose_name='Subject'),
        ),
        migrations.AlterField(
            model_name='requesttype',
            name='description',
            field=models.TextField(blank=True, help_text='Optional: A brief description of what this request type covers.', null=True, verbose_name='Description'),
        ),
        migrations.AlterField(
            model_name='requesttype',
            name='name',
            field=models.CharField(help_text='e.g., New Equipment, Repair, Software Installation, Access Request', max_length=100, unique=True, verbose_name='Request Type Name'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='new_status',
            field=models.CharField(blank=True, help_text='Status after this update.', max_length=50, null=True, verbose_name='New Status'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='notes',
            field=models.TextField(help_text='Description of the update or action taken.', verbose_name='Update Notes'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='old_status',
            field=models.CharField(blank=True, help_text='Status before this update.', max_length=50, null=True, verbose_name='Old Status'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='request',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='updates', to='requests_app.request', verbose_name='Associated Request'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='update_time',
            field=models.DateTimeField(default=django.utils.timezone.now, editable=False, verbose_name='Update Time'),
        ),
        migrations.AlterField(
            model_name='requestupdate',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='Updated By'),
        ),
    ]
