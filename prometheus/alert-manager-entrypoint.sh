#!/bin/sh
envsubst < /config/alertmanager.yml.tmpl > /config/alertmanager.yml
exec /bin/alertmanager --config.file=/config/alertmanager.yml --log.level=debug
