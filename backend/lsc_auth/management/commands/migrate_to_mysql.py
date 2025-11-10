#!/usr/bin/env python
"""
Django management command to migrate data from SQLite to MySQL
"""
import os
import sys
import django
import sqlite3
import MySQLdb
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

class Command(BaseCommand):
    help = 'Migrate data from SQLite to MySQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-db',
            default='db.sqlite3',
            help='Path to SQLite database file'
        )
        parser.add_argument(
            '--mysql-db',
            help='MySQL database name (overrides settings)'
        )
        parser.add_argument(
            '--mysql-user',
            help='MySQL username (overrides settings)'
        )
        parser.add_argument(
            '--mysql-password',
            help='MySQL password (overrides settings)'
        )
        parser.add_argument(
            '--mysql-host',
            default='localhost',
            help='MySQL host (overrides settings)'
        )
        parser.add_argument(
            '--mysql-port',
            default='3306',
            help='MySQL port (overrides settings)'
        )

    def handle(self, *args, **options):
        # Setup Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        django.setup()

        # SQLite connection
        sqlite_path = os.path.join(settings.BASE_DIR, options['sqlite_db'])
        if not os.path.exists(sqlite_path):
            raise CommandError(f'SQLite database not found: {sqlite_path}')

        # MySQL connection settings
        mysql_config = {
            'db': options.get('mysql_db') or settings.DATABASES['default']['NAME'],
            'user': options.get('mysql_user') or settings.DATABASES['default']['USER'],
            'passwd': options.get('mysql_password') or settings.DATABASES['default']['PASSWORD'],
            'host': options.get('mysql_host') or settings.DATABASES['default']['HOST'],
            'port': int(options.get('mysql_port') or settings.DATABASES['default']['PORT']),
        }

        self.stdout.write('Starting SQLite to MySQL migration...')
        self.stdout.write(f'SQLite DB: {sqlite_path}')
        self.stdout.write(f'MySQL DB: {mysql_config["db"]}')

        try:
            # Connect to SQLite
            sqlite_conn = sqlite3.connect(sqlite_path)
            sqlite_cursor = sqlite_conn.cursor()

            # Connect to MySQL
            mysql_conn = MySQLdb.connect(**mysql_config)
            mysql_cursor = mysql_conn.cursor()

            # Get all tables from SQLite
            sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = sqlite_cursor.fetchall()

            self.stdout.write(f'Found {len(tables)} tables to migrate')

            for table_name, in tables:
                self.stdout.write(f'Migrating table: {table_name}')

                # Get table schema from SQLite
                sqlite_cursor.execute(f"PRAGMA table_info({table_name})")
                columns = sqlite_cursor.fetchall()

                # Create MySQL table (simplified - you may need to adjust data types)
                column_defs = []
                for col in columns:
                    col_name = col[1]
                    col_type = col[2].upper()

                    # Map SQLite types to MySQL types
                    if 'INTEGER' in col_type:
                        mysql_type = 'INT'
                    elif 'TEXT' in col_type:
                        mysql_type = 'TEXT'
                    elif 'REAL' in col_type:
                        mysql_type = 'DECIMAL(10,2)'
                    elif 'BLOB' in col_type:
                        mysql_type = 'BLOB'
                    else:
                        mysql_type = 'VARCHAR(255)'

                    if col[5]:  # Primary key
                        mysql_type += ' PRIMARY KEY'
                        if col_name == 'id':
                            mysql_type += ' AUTO_INCREMENT'

                    column_defs.append(f'`{col_name}` {mysql_type}')

                create_sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(column_defs)});"
                mysql_cursor.execute(create_sql)

                # Get data from SQLite
                sqlite_cursor.execute(f"SELECT * FROM {table_name}")
                rows = sqlite_cursor.fetchall()

                if rows:
                    # Insert data into MySQL
                    placeholders = ', '.join(['%s'] * len(columns))
                    insert_sql = f"INSERT INTO `{table_name}` VALUES ({placeholders})"
                    mysql_cursor.executemany(insert_sql, rows)
                    self.stdout.write(f'  Migrated {len(rows)} rows')

            mysql_conn.commit()
            self.stdout.write(self.style.SUCCESS('Migration completed successfully!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Migration failed: {str(e)}'))
            mysql_conn.rollback() if 'mysql_conn' in locals() else None
            raise CommandError(f'Migration failed: {str(e)}')

        finally:
            if 'sqlite_conn' in locals():
                sqlite_conn.close()
            if 'mysql_conn' in locals():
                mysql_conn.close()