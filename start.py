import shutil
import subprocess

folder_dst = '/home/feorg/Documents/FoundryVTT/Data/systems/Ilaris'
folder_src = '/home/feorg/Documents/Programming/foundryvtt/systems - working javascript/Ilaris-FoundryVTT'
folder_vtt = '/home/feorg/Downloads/foundry_vtt/foundryvtt-0.7.9/foundryvtt'
start_world = '--world=test_ilaris'

shutil.rmtree(folder_dst)
shutil.copytree(src=folder_src, dst=folder_dst)
subprocess.call([folder_vtt, start_world])
