"""
Quick Database Status Check
============================
This script checks the current state of your databases
"""

import mysql.connector
import sys

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'port': 3306
}

def check_database_status():
    """Check status of all databases"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\n" + "="*70)
        print("CDOE DATABASE STATUS CHECK".center(70))
        print("="*70 + "\n")
        
        # Check which databases exist
        cursor.execute("SHOW DATABASES")
        existing_dbs = [db[0] for db in cursor.fetchall()]
        
        target_dbs = ['cdoe_db', 'lsc_portal_db', 'online_edu', 'lsc_admindb']
        
        print("Database Status:")
        print("-" * 70)
        for db in target_dbs:
            if db in existing_dbs:
                # Get table count
                cursor.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '{db}'")
                table_count = cursor.fetchone()[0]
                
                # Get total rows (approximate)
                cursor.execute(f"""
                    SELECT SUM(table_rows) 
                    FROM information_schema.tables 
                    WHERE table_schema = '{db}'
                """)
                total_rows = cursor.fetchone()[0] or 0
                
                status = "✓ EXISTS"
                print(f"{status:15} {db:25} ({table_count} tables, ~{total_rows} rows)")
            else:
                print(f"✗ NOT FOUND   {db}")
        
        print("\n" + "="*70)
        
        # Check if cdoe_db exists and has data
        if 'cdoe_db' in existing_dbs:
            print("\ncdoe_db Status: READY FOR USE")
            print("\nKey Tables in cdoe_db:")
            print("-" * 70)
            
            key_tables = [
                'api_student',
                'api_application',
                'api_studentdetails',
                'auth_user',
                'authtoken_token',
                'portal_applicationsettings',
                'courses',
                'feepayment'
            ]
            
            for table in key_tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM cdoe_db.{table}")
                    count = cursor.fetchone()[0]
                    status = "✓" if count > 0 else "⚠"
                    print(f"{status} {table:35} {count:>10} rows")
                except mysql.connector.Error:
                    print(f"✗ {table:35} {'NOT FOUND':>10}")
        
        # Check settings.py configuration
        print("\n" + "="*70)
        print("\nDjango Settings Check:")
        print("-" * 70)
        
        import os
        settings_file = os.path.join(
            os.path.dirname(__file__),
            'backend',
            'backend',
            'settings.py'
        )
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if "'NAME': 'cdoe_db'" in content:
                print("✓ Settings configured for: cdoe_db (SINGLE DATABASE)")
            elif "'NAME': 'lsc_portal_db'" in content:
                print("⚠ Settings configured for: lsc_portal_db (MULTI DATABASE)")
                print("  Action needed: Run consolidation script")
            
            if "DATABASE_ROUTERS" in content and "LSCDatabaseRouter" in content:
                if "# DATABASE_ROUTERS" in content:
                    print("✓ Database router: DISABLED (correct for single DB)")
                else:
                    print("⚠ Database router: ENABLED (should be disabled)")
        else:
            print("✗ settings.py not found")
        
        # Recommendation
        print("\n" + "="*70)
        print("\nRECOMMENDATION:")
        print("-" * 70)
        
        if 'cdoe_db' in existing_dbs and ('lsc_portal_db' in existing_dbs or 'online_edu' in existing_dbs):
            print("✓ cdoe_db exists with old databases")
            print("  Status: CONSOLIDATION COMPLETE")
            print("  Action: Test application, then drop old databases")
        elif 'cdoe_db' in existing_dbs:
            print("✓ cdoe_db exists, old databases removed")
            print("  Status: FULLY CONSOLIDATED")
            print("  Action: No action needed")
        elif 'lsc_portal_db' in existing_dbs or 'online_edu' in existing_dbs:
            print("⚠ Old databases exist, cdoe_db not found")
            print("  Status: NOT CONSOLIDATED")
            print("  Action: Run consolidation script")
            print("          python consolidate_databases.py")
        else:
            print("✗ No databases found")
            print("  Status: SETUP REQUIRED")
            print("  Action: Run initial database setup")
        
        print("\n" + "="*70 + "\n")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"\n✗ Database connection error: {err}")
        print("\nPlease check:")
        print("  1. MySQL server is running")
        print("  2. Credentials in DB_CONFIG are correct")
        print("  3. User has proper permissions")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    check_database_status()
