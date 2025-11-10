# Generated migration to add missing fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_application_application_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='gender',
            field=models.CharField(blank=True, choices=[('Male', 'Male'), ('Female', 'Female'), ('Transgender', 'Transgender')], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='application',
            name='payment_status',
            field=models.CharField(choices=[('N', 'Not Paid'), ('P', 'Paid')], default='N', max_length=1),
        ),
        migrations.AddField(
            model_name='application',
            name='status',
            field=models.CharField(choices=[('Draft', 'Draft'), ('In Progress', 'In Progress'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled')], default='Draft', max_length=20),
        ),
        migrations.AddField(
            model_name='application',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
