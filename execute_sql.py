#!/usr/bin/env python3
"""
Execute SQL file to insert courses with fees
"""

import pymysql

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Empty password
    'database': 'cdoe_db',
    'charset': 'utf8mb4'
}

def execute_sql_file(file_path):
    try:
        # Connect to MySQL
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()

        print("Connected to MySQL database")

        # First, show the table structure
        cursor.execute("DESCRIBE tbl_course")
        columns = cursor.fetchall()
        print(f"Table tbl_course has {len(columns)} columns:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")

        # Read SQL file
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()

        # Execute the entire SQL content
        print("Executing SQL...")
        cursor.execute(sql_content)
        connection.commit()
        print("✓ All statements executed successfully")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("MySQL connection closed")

if __name__ == "__main__":
    execute_sql_file('insert_courses_with_fees.sql')