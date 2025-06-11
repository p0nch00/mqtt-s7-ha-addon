#!/bin/bash

CONFIG_PATH="/ha-cfg/mqtts7/config.json"
APP_CONFIG="/app/src/config.json"

cp $CONFIG_PATH $APP_CONFIG

ls app/src

ls -la

cat $APP_CONFIG

exec npm start
