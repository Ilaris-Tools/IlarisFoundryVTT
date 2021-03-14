import shutil
import subprocess
import settings_local

"""
Beispiel Settings in settings_local.py:
folder_destination = '/home/feorg/Documents/FoundryVTT/Data/systems/Ilaris'
folder_source = '/home/feorg/Documents/Programming/foundryvtt/systems - working javascript/Ilaris-FoundryVTT'
folder_Foundryvtt = '/home/feorg/Downloads/foundry_vtt/foundryvtt-0.7.9/foundryvtt'
start_world_options = '--world=test_ilaris'
"""

folder_destination = settings_local.folder_destination
folder_source = settings_local.folder_source
folder_Foundryvtt = settings_local.folder_Foundryvtt
start_world_options = settings_local.start_world_options

shutil.rmtree(folder_destination)
shutil.copytree(src=folder_source, dst=folder_destination)
subprocess.call([folder_Foundryvtt, start_world_options])
