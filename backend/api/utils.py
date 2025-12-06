import requests
import os
import shutil
from django.conf import settings
from pathlib import Path

def get_real_academic_year():
    try:
        response = requests.get("http://worldtimeapi.org/api/timezone/Etc/UTC")
        response.raise_for_status()
        current_year = int(response.json()["datetime"][:4])
        return f"{current_year}-{current_year + 1}"
    except Exception as e:
        print("Error fetching real-time:", e)
        from datetime import datetime
        current_year = datetime.now().year
        return f"{current_year}-{current_year + 1}"

def create_user_folder_structure(email):
    safe_email = email.replace('@', '_at_').replace('.', '_')
    base_path = os.path.join(settings.MEDIA_ROOT, 'student_documents', safe_email)
    subfolders = ['SSLC', 'HSC', 'UG', 'Semester', 'Photo', 'Signature', 'Community_Certificate', 'Aadhar_Card', 'Transfer_Certificate']
    folder_paths = {}
    for subfolder in subfolders:
        folder_path = os.path.join(base_path, subfolder)
        Path(folder_path).mkdir(parents=True, exist_ok=True)
        folder_paths[subfolder] = folder_path
    return folder_paths

def upload_to_local_storage(file_path, file_name, folder_path):
    try:
        print(f"DEBUG - file_path: {file_path}")
        print(f"DEBUG - file_name: {file_name}")
        print(f"DEBUG - folder_path: {folder_path}")
        print(f"DEBUG - file_path exists: {os.path.exists(file_path)}")
        
        # Ensure the folder exists - use extended-length path prefix for Windows
        folder_path_obj = Path(folder_path)
        folder_path_obj.mkdir(parents=True, exist_ok=True)
        print(f"DEBUG - folder created/verified: {folder_path}")
        
        # Shorten filename if too long (Windows has 260 char path limit)
        # Extract extension
        name_parts = file_name.rsplit('.', 1)
        base_name = name_parts[0]
        extension = name_parts[1] if len(name_parts) > 1 else ''
        
        # Calculate available space for filename (leave room for path + extension)
        max_name_length = 50  # Conservative limit for filename itself
        if len(base_name) > max_name_length:
            # Keep first part and add hash of full name
            import hashlib
            name_hash = hashlib.md5(base_name.encode()).hexdigest()[:8]
            base_name = f"{base_name[:max_name_length-9]}_{name_hash}"
        
        shortened_filename = f"{base_name}.{extension}" if extension else base_name
        dest_path = os.path.join(folder_path, shortened_filename)
        
        # Use extended-length path prefix for Windows long paths
        if os.name == 'nt' and not dest_path.startswith('\\\\?\\'):
            dest_path_long = '\\\\?\\' + os.path.abspath(dest_path)
            file_path_long = '\\\\?\\' + os.path.abspath(file_path) if not file_path.startswith('\\\\?\\') else file_path
        else:
            dest_path_long = dest_path
            file_path_long = file_path
            
        print(f"DEBUG - dest_path: {dest_path}")
        print(f"DEBUG - dest_path length: {len(dest_path)}")
        
        shutil.copy2(file_path_long, dest_path_long)
        print(f"DEBUG - file copied successfully")
        
        relative_path = os.path.relpath(dest_path, settings.MEDIA_ROOT)
        url_path = relative_path.replace('\\', '/')
        return f"{settings.MEDIA_URL}{url_path}"
    except Exception as e:
        print(f"DEBUG - Error in upload_to_local_storage: {str(e)}")
        print(f"DEBUG - Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Failed to upload file to local storage: {str(e)}")
