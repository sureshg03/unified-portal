# Run this migration to add document_validation field to Application model

from django.db import migrations, models

def add_document_validation_field(apps, schema_editor):
    """
    Add document_validation JSONField to Application model
    """
    from django.db import connection
    db_alias = schema_editor.connection.alias
    
    if db_alias == 'online_edu':
        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = 'online_edu' 
                AND TABLE_NAME = 'api_application' 
                AND COLUMN_NAME = 'document_validation'
            """)
            exists = cursor.fetchone()[0]
            
            if not exists:
                # Add document_validation column as JSON
                cursor.execute("""
                    ALTER TABLE api_application 
                    ADD COLUMN document_validation JSON DEFAULT NULL
                """)
                
                # Add verified_date column
                cursor.execute("""
                    ALTER TABLE api_application 
                    ADD COLUMN verified_date DATETIME DEFAULT NULL
                """)
                
                # Add verified_by column
                cursor.execute("""
                    ALTER TABLE api_application 
                    ADD COLUMN verified_by VARCHAR(255) DEFAULT NULL
                """)
                
                print("✅ Added document_validation, verified_date, and verified_by fields")


class Migration(migrations.Migration):
    
    dependencies = [
        ('api', '0001_initial'),  # Adjust based on your last migration
    ]
    
    operations = [
        migrations.RunPython(add_document_validation_field),
    ]
