#!/bin/bash


set -e 


echo "Waiting for Ganache..."
sleep 10


echo "Executing calls no Truffle..."
truffle exec execute_calls.js --network development