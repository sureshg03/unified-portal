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

def add_missing_columns():
    """Add missing columns to api_application table"""
    try:
        # Connect to database
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        
        print("Connected to database: online_edu")
        
        # Check current columns
        cursor.execute("DESC api_application")
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"\nCurrent columns count: {len(existing_columns)}")
        
        # Define columns to add
        columns_to_add = {
            'gender': "VARCHAR(20) NULL AFTER dob",
            'payment_status': "VARCHAR(1) NOT NULL DEFAULT 'N' AFTER perm_area",
            'status': "VARCHAR(20) NOT NULL DEFAULT 'Draft' AFTER payment_status",
            'is_active': "TINYINT(1) NOT NULL DEFAULT 1 AFTER status"
        }
        
        # Add each column if it doesn't exist
        for column_name, column_def in columns_to_add.items():
            if column_name not in existing_columns:
                sql = f"ALTER TABLE api_application ADD COLUMN {column_name} {column_def}"
                print(f"\nAdding column: {column_name}")
                print(f"SQL: {sql}")
                cursor.execute(sql)
                connection.commit()
                print(f"✓ Successfully added column: {column_name}")
            else:
                print(f"✓ Column already exists: {column_name}")
        
        # Verify final columns
        cursor.execute("DESC api_application")
        final_columns = cursor.fetchall()
        print(f"\n{'='*80}")
        print(f"Final columns count: {len(final_columns)}")
        print(f"{'='*80}")
        
        # Show the newly added columns
        print("\nNewly added columns:")
        for col in final_columns:
            if col[0] in columns_to_add.keys():
                print(f"  - {col[0]}: {col[1]} (Default: {col[4]})")
        
        cursor.close()
        connection.close()
        print("\n✓ All missing columns added successfully!")
        print("✓ Please restart the Django server for changes to take effect.")
        return True
        
    except pymysql.Error as e:
        print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = add_missing_columns()
    sys.exit(0 if success else 1)
