# utils.py
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
        # fallback to system time if API fails
        from datetime import datetime
        current_year = datetime.now().year
        return f"{current_year}-{current_year + 1}"

def create_user_folder_structure(email):
    """
    Create a folder structure for the user to store documents locally.
    Structure: MEDIA_ROOT/student_documents/{email}/
        - SSLC/
        - HSC/
        - UG/
        - Semester/
        - Photo/
        - Signature/
        - Community_Certificate/
        - Aadhar_Card/
        - Transfer_Certificate/
    
    Returns: Dictionary with folder names and their absolute paths
    """
    # Sanitize email for folder name
    safe_email = email.replace('@', '_at_').replace('.', '_')
    
    # Base path for student documents
    base_path = os.path.join(settings.MEDIA_ROOT, 'student_documents', safe_email)
    
    # Define subfolders
    subfolders = [
        'SSLC',
        'HSC', 
        'UG',
        'Semester',
        'Photo',
        'Signature',
        'Community_Certificate',
        'Aadhar_Card',
        'Transfer_Certificate'
    ]
    
    # Create directories
    folder_paths = {}
    for subfolder in subfolders:
        folder_path = os.path.join(base_path, subfolder)
        Path(folder_path).mkdir(parents=True, exist_ok=True)
        folder_paths[subfolder] = folder_path
    
    return folder_paths


def upload_to_local_storage(file_path, file_name, folder_path):
    """
    Upload a file to local storage and return its relative URL path.
    
    Args:
        file_path: Path to the temporary file
        file_name: Name to save the file as
        folder_path: Destination folder path
    
    Returns:
        Relative URL path to access the file
    """
    try:
        # Full destination path
        dest_path = os.path.join(folder_path, file_name)
        
        # Copy file to destination
        shutil.copy2(file_path, dest_path)
        
        # Generate relative URL path
        # Extract path relative to MEDIA_ROOT
        relative_path = os.path.relpath(dest_path, settings.MEDIA_ROOT)
        
        # Convert to URL path (use forward slashes)
        url_path = relative_path.replace('\\', '/')
        
        # Return URL path that will be served by Django
        return f"{settings.MEDIA_URL}{url_path}"
    
    except Exception as e:
        raise Exception(f"Failed to upload file to local storage: {str(e)}")