#!/bin/sh

if ! echo "Ganache is running"; then
  exit 1
fi

if ! ls /usr/src/app/shared/deployedAddress.json; then
  exit 1
fi

exit 0