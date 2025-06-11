#!/bin/bash

CONFIG_PATH="/data/config.json"
APP_CONFIG="/app/src/config.json"

# Create default config if not exists
if [ ! -f "$CONFIG_PATH" ]; then
  echo '{"mqtt": {"host": "localhost", "port": 1883}, "s7": {"ip": "192.168.0.1"}}' > "$CONFIG_PATH"
fi

ln -sf "$CONFIG_PATH" "$APP_CONFIG"

exec npm start
