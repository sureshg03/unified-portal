"""
Simple Data Migration Script
Migrates any remaining data from old databases to cdoe_db
"""

import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'port': 3306
}

def migrate_remaining_data():
    """Migrate any remaining tables/data"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\n" + "="*70)
        print("MIGRATING REMAINING DATA TO cdoe_db".center(70))
        print("="*70 + "\n")
        
        # Migration plan - tables that might be missing
        migration_plan = {
            'online_edu': [
                'courses',
                'api_course',
            ],
        }
        
        total_migrated = 0
        
        for source_db, tables in migration_plan.items():
            print(f"Checking {source_db}...")
            
            for table in tables:
                try:
                    # Check if table exists in source
                    cursor.execute(f"SHOW TABLES FROM {source_db} LIKE '{table}'")
                    if not cursor.fetchone():
                        print(f"  ✗ {table} not found in {source_db}")
                        continue
                    
                    # Check if table exists in target
                    cursor.execute(f"SHOW TABLES FROM cdoe_db LIKE '{table}'")
                    if not cursor.fetchone():
                        # Create table structure
                        print(f"  Creating {table} structure...")
                        cursor.execute(f"CREATE TABLE cdoe_db.{table} LIKE {source_db}.{table}")
                        conn.commit()
                    
                    # Get row count from source
                    cursor.execute(f"SELECT COUNT(*) FROM {source_db}.{table}")
                    source_count = cursor.fetchone()[0]
                    
                    if source_count == 0:
                        print(f"  ℹ {table}: Empty in source")
                        continue
                    
                    # Copy data
                    print(f"  Migrating {table} ({source_count} rows)...")
                    cursor.execute(f"""
                        INSERT IGNORE INTO cdoe_db.{table}
                        SELECT * FROM {source_db}.{table}
                    """)
                    conn.commit()
                    
                    # Verify
                    cursor.execute(f"SELECT COUNT(*) FROM cdoe_db.{table}")
                    target_count = cursor.fetchone()[0]
                    
                    print(f"  ✓ {table}: {target_count} rows in cdoe_db")
                    total_migrated += target_count
                    
                except mysql.connector.Error as err:
                    print(f"  ✗ {table}: Error - {err}")
                    continue
        
        print(f"\n{'='*70}")
        print(f"Total rows migrated: {total_migrated}")
        print(f"{'='*70}\n")
        
        cursor.close()
        conn.close()
        
        print("✓ Migration complete!")
        
    except mysql.connector.Error as err:
        print(f"✗ Database error: {err}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")

if __name__ == "__main__":
    migrate_remaining_data()
