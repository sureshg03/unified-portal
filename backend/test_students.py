import requests

try:
    response = requests.get('http://localhost:8000/api/lsc-admin/student-admissions/')
    print(f'Status Code: {response.status_code}')
    
    data = response.json()
    print(f'Count in response: {data.get("count", 0)}')
    print(f'Number of students in data array: {len(data.get("data", []))}')
    
    if data.get('data'):
        print(f'\nFirst few students:')
        for i, student in enumerate(data['data'][:5], 1):
            print(f'{i}. {student.get("application_no")} - {student.get("name")}')
            
except Exception as e:
    print(f'Error: {e}')
