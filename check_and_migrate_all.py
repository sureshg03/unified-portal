"""
Check and migrate all tables from old databases to cdoe_db
"""

import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'port': 3306
}

def check_and_migrate_all():
    """Check all tables and migrate missing ones"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\n" + "="*70)
        print("CHECKING ALL TABLES".center(70))
        print("="*70 + "\n")
        
        # Get all tables from old databases
        source_dbs = ['lsc_portal_db', 'online_edu', 'lsc_admindb']
        
        for source_db in source_dbs:
            print(f"\nTables in {source_db}:")
            print("-" * 70)
            cursor.execute(f"SHOW TABLES FROM {source_db}")
            tables = [t[0] for t in cursor.fetchall()]
            
            for table in tables:
                # Check row count
                cursor.execute(f"SELECT COUNT(*) FROM {source_db}.{table}")
                count = cursor.fetchone()[0]
                
                # Check if exists in cdoe_db
                cursor.execute(f"SHOW TABLES FROM cdoe_db LIKE '{table}'")
                in_cdoe = "✓" if cursor.fetchone() else "✗"
                
                print(f"  {in_cdoe} {table:40} ({count} rows)")
                
                # Migrate if not in cdoe_db and has data
                if in_cdoe == "✗" and count > 0:
                    try:
                        print(f"    → Migrating {table}...")
                        cursor.execute(f"CREATE TABLE cdoe_db.{table} LIKE {source_db}.{table}")
                        cursor.execute(f"INSERT INTO cdoe_db.{table} SELECT * FROM {source_db}.{table}")
                        conn.commit()
                        print(f"    ✓ Migrated {table} ({count} rows)")
                    except mysql.connector.Error as e:
                        print(f"    ✗ Error: {e}")
        
        print(f"\n{'='*70}")
        print("Migration check complete!")
        print(f"{'='*70}\n")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")

if __name__ == "__main__":
    check_and_migrate_all()
