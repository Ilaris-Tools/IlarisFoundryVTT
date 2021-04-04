from pathlib import Path
import shutil
import subprocess
import settings_local
from zipfile import ZipFile

"""
Beispiel Settings in settings_local.py:
folder_destination = '/home/feorg/Documents/FoundryVTT/Data/systems/Ilaris'
folder_source = '/home/feorg/Documents/Programming/foundryvtt/systems - working javascript/Ilaris-FoundryVTT'
folder_Foundryvtt = '/home/feorg/Downloads/foundry_vtt/foundryvtt-0.7.9/foundryvtt'
start_world_options = '--world=test_ilaris'
ilaris_zip = "ilaris-foundryvtt.zip"
ignore_files = [".gitignore", "start.py", "settings_local.py", "__pychache__", ".git"]
"""


ignore_files = settings_local.ignore_files
folder_destination = Path(settings_local.folder_destination)
folder_source = Path(settings_local.folder_source)
folder_Foundryvtt = Path(settings_local.folder_Foundryvtt)
start_world_options = settings_local.start_world_options
ilaris_zip = settings_local.ilaris_zip
zip_file = folder_source / ilaris_zip

if zip_file.exists():
    zip_file.unlink()

zip_file_paths = []
for path in sorted(folder_source.rglob('*')):
    if [path for i in ignore_files if i in str(path)]:
        continue
    else:
        zip_file_paths.append(path)

with ZipFile(zip_file, 'w') as zip:
    for file in zip_file_paths:
        zip.write(file, "ilaris" / file.relative_to(folder_source))


shutil.rmtree(folder_destination)
shutil.copytree(src=folder_source, dst=folder_destination)
subprocess.call([folder_Foundryvtt, start_world_options])
