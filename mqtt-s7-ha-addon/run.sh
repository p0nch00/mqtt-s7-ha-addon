#!/bin/bash

CONFIG_PATH="/ha-cfg/mqtts7/config.json"
APP_CONFIG="/app/src/config.json"

ln -sf "$CONFIG_PATH" "$APP_CONFIG"

cat $CONFIG_PATH

exec npm start
