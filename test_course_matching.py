import mysql.connector

def get_course_code(course_name):
    """Test the course code matching logic"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='cdoe_db'
        )
        cursor = conn.cursor()
        
        # Try exact match first against degree field
        cursor.execute("""
            SELECT course_code, degree, course_short_code 
            FROM tbl_course 
            WHERE degree LIKE %s
            LIMIT 1
        """, [f'%{course_name}%'])
        row = cursor.fetchone()
        
        if row:
            cursor.close()
            conn.close()
            return row
        
        # If no match, try keyword matching
        course_upper = course_name.upper()
        search_term = None
        
        if 'COMPUTER APPLICATION' in course_upper or 'MCA' in course_upper:
            search_term = 'M.C.A'
        elif 'BUSINESS ADMINISTRATION' in course_upper or 'MBA' in course_upper:
            search_term = 'M.B.A'
        elif 'COMMERCE' in course_upper or 'M.COM' in course_upper:
            search_term = 'M.COM'
        elif 'MATHEMATICS' in course_upper or 'MATHS' in course_upper:
            search_term = 'M.SC'
        elif 'ENGLISH' in course_upper:
            search_term = 'M.A'
        
        if search_term:
            cursor.execute("""
                SELECT course_code, degree, course_short_code 
                FROM tbl_course 
                WHERE course_short_code = %s OR degree LIKE %s
                LIMIT 1
            """, [search_term, f'%{search_term}%'])
            row = cursor.fetchone()
        
        cursor.close()
        conn.close()
        return row
        
    except Exception as e:
        print(f"Error: {e}")
        return None

# Test cases
print("\n" + "="*80)
print("TESTING COURSE CODE MATCHING")
print("="*80 + "\n")

test_courses = [
    "MASTER OF COMPUTER APPLICATIONS - COMPUTER APPLICATION",
    "MASTER OF BUSINESS ADMINISTRATION",
    "MASTER OF COMMERCE",
    "M.Sc. Mathematics",
    "M.A. English"
]

for course in test_courses:
    result = get_course_code(course)
    if result:
        print(f"Course: {course}")
        print(f"  ✓ Matched Code: {result[0]}")
        print(f"  ✓ Degree: {result[1]}")
        print(f"  ✓ Short Code: {result[2]}")
    else:
        print(f"Course: {course}")
        print(f"  ✗ No match found")
    print("-" * 80)
