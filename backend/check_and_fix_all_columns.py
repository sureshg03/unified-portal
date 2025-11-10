import pymysql
import sys

# Database connection settings
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'online_edu',
    'charset': 'utf8mb4'
}

def check_and_fix_all_columns():
    """Check all columns in api_application and make appropriate ones nullable"""
    try:
        # Connect to database
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        
        print("Connected to database: online_edu")
        print("\n" + "="*80)
        print("CHECKING ALL COLUMNS IN api_application TABLE")
        print("="*80)
        
        # Get all columns
        cursor.execute("SHOW COLUMNS FROM api_application")
        all_columns = cursor.fetchall()
        
        print(f"\nTotal columns: {len(all_columns)}\n")
        
        # Columns that should NOT be NULL
        required_columns = ['id', 'user_id', 'email']
        
        # Track columns that need fixing
        columns_to_fix = []
        
        print("Current NULL status:")
        print("-" * 80)
        for col in all_columns:
            field_name = col[0]
            field_type = col[1]
            null_allowed = col[2]
            default_value = col[4]
            
            # Check if NOT NULL but should allow NULL (except required columns)
            if null_allowed == 'NO' and field_name not in required_columns:
                columns_to_fix.append((field_name, field_type))
                print(f"❌ {field_name:30s} | Type: {field_type:20s} | NULL: {null_allowed:3s} | Default: {default_value}")
            else:
                status = "✓" if null_allowed == 'YES' or field_name in required_columns else "❌"
                print(f"{status} {field_name:30s} | Type: {field_type:20s} | NULL: {null_allowed:3s} | Default: {default_value}")
        
        if columns_to_fix:
            print("\n" + "="*80)
            print(f"Found {len(columns_to_fix)} columns that need to allow NULL")
            print("="*80)
            
            for field_name, field_type in columns_to_fix:
                # Clean up the field type - remove any constraints
                clean_type = field_type.split(' ')[0] if ' ' in field_type else field_type
                
                sql = f"ALTER TABLE api_application MODIFY COLUMN `{field_name}` {clean_type} NULL"
                print(f"\nFixing: {field_name}")
                print(f"SQL: {sql}")
                try:
                    cursor.execute(sql)
                    connection.commit()
                    print(f"✓ Successfully modified: {field_name}")
                except Exception as e:
                    print(f"✗ Error modifying {field_name}: {e}")
        else:
            print("\n✓ All columns are properly configured!")
        
        cursor.close()
        connection.close()
        print("\n" + "="*80)
        print("✓ Database check and fix completed!")
        print("✓ Please restart Django server for changes to take effect.")
        print("="*80)
        return True
        
    except pymysql.Error as e:
        print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = check_and_fix_all_columns()
    sys.exit(0 if success else 1)
