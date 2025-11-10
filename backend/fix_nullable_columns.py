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

def fix_nullable_columns():
    """Make deb_id and abc_id columns nullable"""
    try:
        # Connect to database
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        
        print("Connected to database: online_edu")
        
        # Check current column definitions
        cursor.execute("SHOW COLUMNS FROM api_application WHERE Field IN ('deb_id', 'abc_id')")
        current_columns = cursor.fetchall()
        
        print("\nCurrent column definitions:")
        for col in current_columns:
            print(f"  {col[0]}: {col[1]} | Null: {col[2]} | Default: {col[4]}")
        
        # Modify columns to allow NULL
        columns_to_modify = [
            ('deb_id', 'VARCHAR(100) NULL'),
            ('abc_id', 'VARCHAR(100) NULL')
        ]
        
        print("\n" + "="*80)
        for column_name, column_def in columns_to_modify:
            sql = f"ALTER TABLE api_application MODIFY COLUMN {column_name} {column_def}"
            print(f"Modifying column: {column_name}")
            print(f"SQL: {sql}")
            cursor.execute(sql)
            connection.commit()
            print(f"✓ Successfully modified column: {column_name}")
        
        # Verify changes
        print("\n" + "="*80)
        cursor.execute("SHOW COLUMNS FROM api_application WHERE Field IN ('deb_id', 'abc_id')")
        modified_columns = cursor.fetchall()
        
        print("\nUpdated column definitions:")
        for col in modified_columns:
            print(f"  {col[0]}: {col[1]} | Null: {col[2]} | Default: {col[4]}")
        
        cursor.close()
        connection.close()
        print("\n✓ Columns modified successfully!")
        print("✓ deb_id and abc_id now allow NULL values.")
        print("✓ Please restart the Django server if it's running.")
        return True
        
    except pymysql.Error as e:
        print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = fix_nullable_columns()
    sys.exit(0 if success else 1)
