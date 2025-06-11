#!/bin/bash

CONFIG_PATH="/ha-cfg/mqtts7/config.json"
APP_CONFIG="config.json"

cp $CONFIG_PATH $APP_CONFIG

exec npm start
