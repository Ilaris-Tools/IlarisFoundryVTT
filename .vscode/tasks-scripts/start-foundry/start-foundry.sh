#!/bin/bash
echo "Linux script is executed"
script_name=$0
script_full_path=$(dirname "$0")
script_full_path_env="$script_full_path/developer.env"

source $script_full_path_env
if [ "$?" -ne "0" ]; then
  printf "\n Please create an 'developer.env' based on 'developer.template.env' with the content that matches your operating system in the same folder as the 'developer.template.env' and enter the information after the '=' \n\n"
  exit 1
fi

cd ~

$PATH_TO_FOUNDRY$FILE_TO_START_FOUNDRY


