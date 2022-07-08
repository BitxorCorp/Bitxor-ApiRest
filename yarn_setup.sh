#!/bin/sh

# install servers
for module in 'bitxorcore-sdk' 'rest' 'spammer' 'tools'
do
	cd "${module}"
	yarn install
	cd ..
done
