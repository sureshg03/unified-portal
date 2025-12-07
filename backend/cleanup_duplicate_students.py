#!/usr/bin/env python
"""
Script to identify and clean up duplicate Student records
"""
import os
import sys
import django
from collections import defaultdict

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Student

def find_duplicate_students():
    """Find students with duplicate emails"""
    students = Student.objects.all()
    email_counts = defaultdict(list)

    for student in students:
        email_counts[student.email].append(student)

    duplicates = {email: students for email, students in email_counts.items() if len(students) > 1}

    return duplicates

def cleanup_duplicate_students():
    """Clean up duplicate students, keeping the most recent one"""
    duplicates = find_duplicate_students()

    if not duplicates:
        print("No duplicate students found!")
        return

    print(f"Found {len(duplicates)} emails with duplicate students:")

    for email, students in duplicates.items():
        print(f"\nEmail: {email}")
        print(f"Number of duplicates: {len(students)}")

        # Print details of each student
        for i, student in enumerate(students):
            print(f"  Student {i+1}: ID={student.pk}, Name={student.name}, Email={student.email}")

        # Sort by primary key (assuming higher ID is more recent)
        students_sorted = sorted(students, key=lambda s: s.pk, reverse=True)  # Higher ID first

        # Keep the first one (most recent) and delete the rest
        to_keep = students_sorted[0]
        to_delete = students_sorted[1:]

        print(f"Keeping student ID: {to_keep.pk}, Name: {to_keep.name}")
        print(f"Deleting {len(to_delete)} duplicates: {[s.pk for s in to_delete]}")

        # Actually delete the duplicates
        for student in to_delete:
            try:
                pk = student.pk
                student.delete()
                print(f"Successfully deleted duplicate student ID: {pk}")
            except Exception as e:
                print(f"Error deleting student ID {student.pk}: {e}")

    print("\nCleanup completed!")

if __name__ == "__main__":
    print("Checking for duplicate students...")
    duplicates = find_duplicate_students()

    if duplicates:
        print(f"Found {len(duplicates)} emails with duplicates.")
        response = input("Do you want to clean up duplicates? (y/N): ")
        if response.lower() == 'y':
            cleanup_duplicate_students()
        else:
            print("Cleanup cancelled.")
    else:
        print("No duplicates found!")