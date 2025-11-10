from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from admissions.models import StudentDetails  # Replace 'admissions' with your app name
import requests
import os
import re

class Command(BaseCommand):
    help = 'Migrate Google Drive images to local storage'

    def handle(self, *args, **kwargs):
        for detail in StudentDetails.objects.all():
            for field in ['photo_url', 'signature_url']:
                url = getattr(detail, field)
                if not url or 'drive.google.com' not in url:
                    self.stdout.write(self.style.WARNING(f'Skipping non-Google Drive URL: {url}'))
                    continue
                # Extract file ID
                patterns = [
                    r'\/file\/d\/([^/]+)\/?',
                    r'id=([^&]+)',
                    r'\/d\/([^/]+)\/?',
                ]
                file_id = None
                for pattern in patterns:
                    match = re.search(pattern, url)
                    if match:
                        file_id = match.group(1)
                        break
                if not file_id:
                    self.stdout.write(self.style.ERROR(f'Invalid URL: {url}'))
                    continue
                # Download image
                image_url = f"https://drive.google.com/uc?export=download&id={file_id}"
                try:
                    response = requests.get(image_url, stream=True, timeout=10)
                    if response.status_code == 200:
                        # Save to media
                        file_name = f"{detail.user.email}_{field}_{file_id}.jpg"
                        file_path = os.path.join('documents', file_name)
                        with default_storage.open(file_path, 'wb+') as destination:
                            for chunk in response.iter_content(chunk_size=8192):
                                destination.write(chunk)
                        new_url = default_storage.url(file_path)
                        setattr(detail, field, new_url)
                        detail.save()
                        self.stdout.write(self.style.SUCCESS(f'Migrated {url} to {new_url}'))
                    else:
                        self.stdout.write(self.style.ERROR(f'Failed to download {url}: Status {response.status_code}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error downloading {url}: {str(e)}'))