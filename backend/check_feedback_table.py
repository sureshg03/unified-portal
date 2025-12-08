import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='cdoe_db')
cur = conn.cursor()
cur.execute('DESCRIBE feedbacks')
print('Feedbacks table structure:')
for row in cur.fetchall():
    print(row)
conn.close()
print('\nTable created successfully!')
