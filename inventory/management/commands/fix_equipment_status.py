# Version: 1.1 - 2025-05-26 10:12:29 UTC - gmaisuradze-adm - Added fix for category_id
from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Sets status_id and category_id to NULL for specific equipment items to resolve IntegrityError during migration.'

    def handle(self, *args, **options):
        equipment_ids_to_fix = [1] # Add other IDs if needed, e.g., [1, 5, 12]
        fields_to_nullify = ['status_id', 'category_id'] # Add other problematic FK fields here if they appear

        with connection.cursor() as cursor:
            for equipment_id in equipment_ids_to_fix:
                try:
                    # Check if equipment exists
                    cursor.execute(f"SELECT id FROM inventory_equipment WHERE id = {equipment_id}")
                    if cursor.fetchone() is None:
                        self.stdout.write(self.style.WARNING(f"Equipment with ID {equipment_id} not found. Skipping."))
                        continue

                    for field_name in fields_to_nullify:
                        try:
                            # Check if column exists before attempting update
                            # This is a very basic check; more robust would be to inspect table schema via PRAGMA for SQLite
                            cursor.execute(f"SELECT {field_name} FROM inventory_equipment WHERE id = {equipment_id} LIMIT 1") 
                            
                            # Proceed with the update
                            cursor.execute(f"UPDATE inventory_equipment SET {field_name} = NULL WHERE id = {equipment_id}")
                            self.stdout.write(self.style.SUCCESS(f"Successfully set {field_name} to NULL for equipment ID {equipment_id}."))
                        
                        except Exception as e_field:
                            if "no such column" in str(e_field).lower() and field_name in str(e_field).lower():
                                self.stdout.write(self.style.NOTICE(f"Column '{field_name}' likely doesn't exist yet for equipment ID {equipment_id}. This is okay if the migration hasn't run. Error: {e_field}"))
                            else:
                                self.stderr.write(self.style.ERROR(f"Failed to update {field_name} for equipment ID {equipment_id}. Error: {e_field}"))
                
                except Exception as e_main:
                     self.stderr.write(self.style.ERROR(f"An error occurred processing equipment ID {equipment_id}. Error: {e_main}"))
            
        self.stdout.write(self.style.SUCCESS("Finished attempting to fix equipment foreign keys."))
