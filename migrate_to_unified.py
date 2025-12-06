#!/usr/bin/env python3
"""
CDOE Unified Database Migration Script
======================================

This script helps migrate from the three separate databases to a single unified database.
It performs the following operations:
1. Creates the unified database
2. Imports the unified schema
3. Migrates data from existing databases
4. Imports data from SQL dump files

Requirements:
- MySQL server running
- Access to source databases (lsc_portal_db, online_edu, lsc_admindb) - NOW CONSOLIDATED INTO cdoe_db
- SQL dump files in the specified directory

Usage:
python migrate_to_unified.py
"""

import os
import mysql.connector
from mysql.connector import Error
import subprocess
import sys
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Update with your MySQL password
    'port': 3306
}

# Source databases
SOURCE_DATABASES = ['cdoe_db']  # Now consolidated into single database

# Target unified database
TARGET_DATABASE = 'cdoe_unified_db'

# SQL dump directory (update this path)
SQL_DUMP_DIR = r"e:\cdoe\Dump20251111"

# SQL files to import (in order of dependency)
SQL_FILES = [
    # Core system tables first
    'sys_routines.sql',
    'sys_sys_config.sql',

    # Study material
    'cdoe_study_material_study_material.sql',

    # ODL CDOE system
    'odl_cdoe_app_open_status.sql',
    'odl_cdoe_application_status.sql',
    'odl_cdoe_cer_fee.sql',
    'odl_cdoe_collegemaster.sql',
    'odl_cdoe_counsellor.sql',
    'odl_cdoe_degshort.sql',
    'odl_cdoe_fee_struct.sql',
    'odl_cdoe_fee_structure.sql',
    'odl_cdoe_feedback.sql',
    'odl_cdoe_feedback_replies.sql',
    'odl_cdoe_feepayment.sql',
    'odl_cdoe_internal_mark.sql',
    'odl_cdoe_learning_support_centre.sql',
    'odl_cdoe_lsc_payment.sql',
    'odl_cdoe_lsc_register.sql',
    'odl_cdoe_registration.sql',
    'odl_cdoe_tbl_course.sql',
    'odl_cdoe_tbl_login.sql',
    'odl_cdoe_tbl_subject.sql',
    'odl_cdoe_teachers.sql',
    'odl_cdoe_user_login.sql',

    # Pride system (Student Admission)
    'pride_admissionyears.sql',
    'pride_appellations.sql',
    'pride_applicationeducations.sql',
    'pride_applications.sql',
    'pride_applicationuploads.sql',
    'pride_appstatuses.sql',
    'pride_batches.sql',
    'pride_bloodgroups.sql',
    'pride_bookissues.sql',
    'pride_categories.sql',
    'pride_centres.sql',
    'pride_centretypes.sql',
    'pride_countries.sql',
    'pride_courses.sql',
    'pride_courseterms.sql',
    'pride_coursetypes.sql',
    'pride_demands.sql',
    'pride_departments.sql',
    'pride_disabilities.sql',
    'pride_districts.sql',
    'pride_edulevels.sql',
    'pride_enrolments.sql',
    'pride_examyears.sql',
    'pride_feestypes.sql',
    'pride_genders.sql',
    'pride_instruments.sql',
    'pride_media.sql',
    'pride_notifications.sql',
    'pride_otplog.sql',
    'pride_otplogs.sql',
    'pride_overall_fee.sql',
    'pride_payments.sql',
    'pride_pcps.sql',
    'pride_people.sql',
    'pride_personaacards.sql',
    'pride_programmes.sql',
    'pride_programmetypes.sql',
    'pride_religions.sql',
    'pride_requests.sql',
    'pride_requesttypes.sql',
    'pride_roles.sql',
    'pride_saved_quries.sql',
    'pride_schools.sql',
    'pride_settings.sql',
    'pride_states.sql',
    'pride_studentstatuses.sql',
    'pride_subjects.sql',
    'pride_taluks.sql',
    'pride_terms.sql',
    'pride_termsubjects.sql',
    'pride_uploads.sql',
    'pride_user_logs.sql',
    'pride_users.sql',
    'pride_villages.sql',
    'pride_yeartypes.sql',

    # Pride No Dues system
    'pridenodues_admission.sql',
    'pridenodues_admission_details.sql',
    'pridenodues_admission_fee_students.sql',
    'pridenodues_applied_stu.sql',
    'pridenodues_applied_stu1.sql',
    'pridenodues_cert_to_nodue.sql',
    'pridenodues_certificate_verification.sql',
    'pridenodues_conduct_certificate.sql',
    'pridenodues_course_certificate.sql',
    'pridenodues_course_fee.sql',
    'pridenodues_course_fee_type1.sql',
    'pridenodues_course_fee_type2.sql',
    'pridenodues_course_fee_type3.sql',
    'pridenodues_courses.sql',
    'pridenodues_medium_certificate.sql',
    'pridenodues_nodues.sql',
    'pridenodues_otplog.sql',
    'pridenodues_overall_fee.sql',
    'pridenodues_pride_payment.sql',
    'pridenodues_provision_to_coe.sql',
    'pridenodues_student_data_course_code.sql',
    'pridenodues_student_details.sql',
    'pridenodues_student_fee.sql',
    'pridenodues_student_fee_old.sql',
    'pridenodues_student_fee_penalty.sql',
    'pridenodues_student_penalty_details_84k.sql',
    'pridenodues_student_penalty_details_staus.sql',
    'pridenodues_studymaterials.sql',
    'pridenodues_studymaterialsugc.sql',
    'pridenodues_tc.sql',
    'pridenodues_uicp_applied_stu.sql',
    'pridenodues_user_tbl.sql',

    # PUC ODE New LMS
    'pucodenewlms_application_status.sql',
    'pucodenewlms_cities.sql',
    'pucodenewlms_collegemaster.sql',
    'pucodenewlms_countries.sql',
    'pucodenewlms_coursepayments.sql',
    'pucodenewlms_credit_structure.sql',
    'pucodenewlms_degshort.sql',
    'pucodenewlms_feepayment.sql',
    'pucodenewlms_feestructure.sql',
    'pucodenewlms_forum.sql',
    'pucodenewlms_progress.sql',
    'pucodenewlms_registration.sql',
    'pucodenewlms_registrations.sql',
    'pucodenewlms_semwisecredit.sql',
    'pucodenewlms_session.sql',
    'pucodenewlms_states.sql',
    'pucodenewlms_subject.sql',
    'pucodenewlms_subjectmodule.sql',
    'pucodenewlms_subjectsubmodule.sql',
    'pucodenewlms_subjectunits.sql',
    'pucodenewlms_tbl_assignment_progress.sql',
    'pucodenewlms_tbl_assignment_question.sql',
    'pucodenewlms_tbl_books.sql',
    'pucodenewlms_tbl_course.sql',
    'pucodenewlms_tbl_events.sql',
    'pucodenewlms_tbl_login.sql',
    'pucodenewlms_tbl_questions.sql',
    'pucodenewlms_tbl_stu_assignment.sql',
    'pucodenewlms_tbl_stu_write_assign_forum_mark.sql',
    'pucodenewlms_tbl_teacher.sql',
    'pucodenewlms_tbl_teacher_course.sql',
    'pucodenewlms_tbl_testassignment.sql',
    'pucodenewlms_tbl_testresultmodule.sql',
    'pucodenewlms_user_login.sql',
    'pucodenewlms_userlog.sql',
    'pucodenewlms_watchvideo.sql',

    # PUC ODE OL system
    'pucodeol_admission_details.sql',
    'pucodeol_applied_stu.sql',
    'pucodeol_course_certificate.sql',
    'pucodeol_course_fee.sql',
    'pucodeol_overall_fee.sql',
    'pucodeol_paytm_payment.sql',
    'pucodeol_provision_to_coe.sql',
    'pucodeol_student_fee.sql',
    'pucodeol_student_penalty_details_84k.sql',
    'pucodeol_student_penalty_details_staus.sql',
    'pucodeol_tc.sql',
    'pucodeol_user_tbl.sql',

    # Billdesk payments
    'billdeskpayments_transactions.sql'
]

def connect_to_mysql():
    """Connect to MySQL server"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ Connected to MySQL server")
        return connection
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None

def create_unified_database(connection):
    """Create the unified database"""
    try:
        cursor = connection.cursor()

        # Drop existing database if it exists
        cursor.execute(f"DROP DATABASE IF EXISTS {TARGET_DATABASE}")
        print(f"🗑️ Dropped existing {TARGET_DATABASE} database")

        # Create new unified database
        cursor.execute(f"CREATE DATABASE {TARGET_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✅ Created {TARGET_DATABASE} database")

        cursor.close()
        return True
    except Error as e:
        print(f"❌ Error creating database: {e}")
        return False

def import_schema(connection):
    """Import the unified database schema"""
    try:
        schema_file = Path(__file__).parent / "CREATE_UNIFIED_DATABASE.sql"
        if not schema_file.exists():
            print(f"❌ Schema file not found: {schema_file}")
            return False

        # Use mysql command line to import schema
        cmd = f'mysql -h {DB_CONFIG["host"]} -u {DB_CONFIG["user"]} {"-p" + DB_CONFIG["password"] if DB_CONFIG["password"] else ""} {TARGET_DATABASE} < "{schema_file}"'

        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        if result.returncode == 0:
            print("✅ Database schema imported successfully")
            return True
        else:
            print(f"❌ Error importing schema: {result.stderr}")
            return False

    except Exception as e:
        print(f"❌ Error importing schema: {e}")
        return False

def migrate_existing_data(connection):
    """Migrate data from existing three databases"""
    try:
        cursor = connection.cursor()

        # Migrate data from each source database
        for source_db in SOURCE_DATABASES:
            print(f"📊 Migrating data from {source_db}...")

            # Check if source database exists
            cursor.execute(f"SHOW DATABASES LIKE '{source_db}'")
            if not cursor.fetchone():
                print(f"⚠️ Source database {source_db} not found, skipping...")
                continue

            # Get all tables from source database
            cursor.execute(f"SHOW TABLES FROM {source_db}")
            tables = cursor.fetchall()

            for (table_name,) in tables:
                try:
                    # Skip Django migration tables
                    if table_name.startswith(('django_migrations', 'auth_', 'sessions', 'admin', 'contenttypes')):
                        continue

                    # Migrate table data
                    cursor.execute(f"INSERT IGNORE INTO {TARGET_DATABASE}.{table_name} SELECT * FROM {source_db}.{table_name}")
                    print(f"  ✅ Migrated {table_name} from {source_db}")

                except Error as e:
                    print(f"  ❌ Error migrating {table_name}: {e}")
                    continue

        cursor.close()
        print("✅ Data migration from existing databases completed")
        return True

    except Error as e:
        print(f"❌ Error during data migration: {e}")
        return False

def import_sql_dumps():
    """Import data from SQL dump files"""
    if not os.path.exists(SQL_DUMP_DIR):
        print(f"❌ SQL dump directory not found: {SQL_DUMP_DIR}")
        return False

    print(f"📁 Importing SQL dumps from: {SQL_DUMP_DIR}")

    for sql_file in SQL_FILES:
        file_path = os.path.join(SQL_DUMP_DIR, sql_file)

        if not os.path.exists(file_path):
            print(f"⚠️ SQL file not found: {sql_file}")
            continue

        try:
            print(f"📄 Importing {sql_file}...")

            # Use mysql command to import
            cmd = f'mysql -h {DB_CONFIG["host"]} -u {DB_CONFIG["user"]} {"-p" + DB_CONFIG["password"] if DB_CONFIG["password"] else ""} {TARGET_DATABASE} < "{file_path}"'

            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if result.returncode == 0:
                print(f"  ✅ Successfully imported {sql_file}")
            else:
                print(f"  ❌ Error importing {sql_file}: {result.stderr}")

        except Exception as e:
            print(f"  ❌ Error importing {sql_file}: {e}")
            continue

    print("✅ SQL dump import process completed")
    return True

def verify_migration(connection):
    """Verify the migration by checking table counts"""
    try:
        cursor = connection.cursor()

        # Get all tables in the unified database
        cursor.execute(f"SHOW TABLES FROM {TARGET_DATABASE}")
        tables = cursor.fetchall()

        print("\n📊 TABLE COUNTS IN UNIFIED DATABASE:")
        print("=" * 50)

        for (table_name,) in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {TARGET_DATABASE}.{table_name}")
                count = cursor.fetchone()[0]
                print("25")
            except Error as e:
                print("25")

        cursor.close()
        return True

    except Error as e:
        print(f"❌ Error verifying migration: {e}")
        return False

def main():
    """Main migration function"""
    print("🚀 CDOE UNIFIED DATABASE MIGRATION")
    print("=" * 50)

    # Connect to MySQL
    connection = connect_to_mysql()
    if not connection:
        sys.exit(1)

    try:
        # Step 1: Create unified database
        print("\n1️⃣ Creating unified database...")
        if not create_unified_database(connection):
            sys.exit(1)

        # Step 2: Import schema
        print("\n2️⃣ Importing database schema...")
        if not import_schema(connection):
            sys.exit(1)

        # Step 3: Migrate existing data
        print("\n3️⃣ Migrating data from existing databases...")
        if not migrate_existing_data(connection):
            sys.exit(1)

        # Step 4: Import SQL dumps
        print("\n4️⃣ Importing SQL dump files...")
        if not import_sql_dumps():
            print("⚠️ Some SQL dumps may have failed to import")

        # Step 5: Verify migration
        print("\n5️⃣ Verifying migration...")
        verify_migration(connection)

        print("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("\nNext steps:")
        print("1. Update your Django settings.py to use the unified database")
        print("2. Run 'python manage.py migrate' to create Django-specific tables")
        print("3. Test your application thoroughly")
        print("4. Backup and optionally drop the old databases")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

    finally:
        if connection:
            connection.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    main()