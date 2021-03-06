/*
 * Copyright (c) 2016-2019, Jaguar0625, gimre, BloodyRookie, Tech Bureau, Corp.
 * Copyright (c) 2020-2021, Jaguar0625, gimre, BloodyRookie.
 * Copyright (c) 2022-present, Kriptxor Corp, Microsula S.A.
 * All rights reserved.
 *
 * This file is part of Bitxorcore.
 *
 * Bitxorcore is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Bitxorcore is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Bitxorcore.  If not, see <http://www.gnu.org/licenses/>.
 */

const errors = require('../server/errors');
const bitxorcore = require('bitxorcore-sdk');
const ini = require('ini');
const fs = require('fs');
const util = require('util');

const { uint64 } = bitxorcore.utils;

module.exports = {
	register: (server, db, services) => {
		const average = array => array.reduce((p, c) => p + c, 0) / array.length;
		const median = array => {
			array.sort((a, b) => a - b);
			const mid = array.length / 2;
			return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
		};

		const readAndParseNetworkPropertiesFile = () => {
			const readFile = util.promisify(fs.readFile);
			return readFile(services.config.apiNode.networkPropertyFilePath, 'utf8')
				.then(fileData => ini.parse(fileData));
		};

		const readAndParseNodePropertiesFile = () => {
			const readFile = util.promisify(fs.readFile);
			return readFile(services.config.apiNode.nodePropertyFilePath, 'utf8')
				.then(fileData => ini.parse(fileData));
		};

		const sanitizeInput = value => value.replace(/[^0-9]/g, '');

		server.get('/network', (req, res, next) => {
			res.send({ name: services.config.network.name, description: services.config.network.description });
			next();
		});

		server.get('/network/properties', (req, res, next) => readAndParseNetworkPropertiesFile()
			.then(propertiesObject => {
				res.send({
					network: propertiesObject.network,
					chain: propertiesObject.chain,
					plugins: propertiesObject['plugin:bitxorcore'].plugins
				});
				next();
			}).catch(() => {
				res.send(errors.createInvalidArgumentError('there was an error reading the network properties file'));
				next();
			}));

		server.get('/network/fees/transaction', (req, res, next) => {
			const numBlocksTransactionFeeStats = services.config.numBlocksTransactionFeeStats || 1;
			const latestBlocksFeeMultiplier = db.latestBlocksFeeMultiplier(numBlocksTransactionFeeStats);
			return Promise.all([readAndParseNodePropertiesFile(), latestBlocksFeeMultiplier,
				readAndParseNetworkPropertiesFile()]).then(feeMultipliers => {
				// defaultDynamicFeeMultiplier -> uint32
				const defaultDynamicFeeMultiplier = parseInt(sanitizeInput(
					feeMultipliers[2].chain.defaultDynamicFeeMultiplier
				), 10);
				const defaultedFeeMultipliers = feeMultipliers[1].map(f => (0 === f ? defaultDynamicFeeMultiplier : f));
				res.send({
					averageFeeMultiplier: Math.floor(average(defaultedFeeMultipliers)),
					medianFeeMultiplier: Math.floor(median(defaultedFeeMultipliers)),
					highestFeeMultiplier: Math.max(...feeMultipliers[1]),
					lowestFeeMultiplier: Math.min(...feeMultipliers[1]),
					minFeeMultiplier: Number(feeMultipliers[0].node.minFeeMultiplier.replace('\'', ''))
				});
				next();
			});
		});

		server.get('/network/fees/rental', (req, res, next) => readAndParseNetworkPropertiesFile().then(propertiesObject => {
			const maxDifficultyBlocks = parseInt(sanitizeInput(
				propertiesObject.chain.maxDifficultyBlocks
			), 10);

			// defaultDynamicFeeMultiplier -> uint32
			const defaultDynamicFeeMultiplier = parseInt(sanitizeInput(
				propertiesObject.chain.defaultDynamicFeeMultiplier
			), 10);

			// rootNamespaceRentalFeePerBlock -> uint64
			const rootNamespaceRentalFeePerBlock = uint64.fromString(sanitizeInput(
				propertiesObject['plugin:bitxorcore'].plugins.namespace.rootNamespaceRentalFeePerBlock
			));

			// rootNamespaceEternalFee -> uint64
			const rootNamespaceEternalFee = uint64.fromString(sanitizeInput(
				propertiesObject['plugin:bitxorcore'].plugins.namespace.rootNamespaceEternalFee
			));

			// isoCodeNamespaceRentalFee -> uint64
			const isoCodeNamespaceRentalFee = uint64.fromString(sanitizeInput(
				propertiesObject['plugin:bitxorcore'].plugins.namespace.isoCodeNamespaceRentalFee
			));

			// unlinkTokenAliasRentalFee -> uint64
			const unlinkTokenAliasRentalFee = uint64.fromString(sanitizeInput(
				propertiesObject['plugin:bitxorcore'].plugins.namespace.unlinkTokenAliasRentalFee
			));

			// childNamespaceRentalFee -> uint64
			const childNamespaceRentalFee = uint64.fromString(sanitizeInput(
				propertiesObject['plugin:bitxorcore'].plugins.namespace.childNamespaceRentalFee
			));

			// tokenRentalFee -> uint64
			const tokenRentalFee = uint64.fromString(sanitizeInput(
				propertiesObject['plugin:bitxorcore'].plugins.token.tokenRentalFee
			));

			return db.latestBlocksFeeMultiplier(maxDifficultyBlocks || 1).then(feeMultipliers => {
				const defaultedFeeMultipliers = feeMultipliers.map(f => (0 === f ? defaultDynamicFeeMultiplier : f));
				const medianNetworkMultiplier = Math.floor(median(defaultedFeeMultipliers));
				const uint64MedianNetworkMultiplier = uint64.fromUint(medianNetworkMultiplier);

				res.send({
					effectiveRootNamespaceRentalFeePerBlock:
							uint64.toString(uint64.multiply(rootNamespaceRentalFeePerBlock, uint64MedianNetworkMultiplier)),
					effectiveChildNamespaceRentalFee:
							uint64.toString(uint64.multiply(childNamespaceRentalFee, uint64MedianNetworkMultiplier)),
					effectiveTokenRentalFee:
							uint64.toString(uint64.multiply(tokenRentalFee, uint64MedianNetworkMultiplier)),
					effectiveRootNamespaceEternalFee:
							uint64.toString(uint64.multiply(rootNamespaceEternalFee, uint64MedianNetworkMultiplier)),
					effectiveIsoCodeNamespaceRentalFee:
							uint64.toString(uint64.multiply(isoCodeNamespaceRentalFee, uint64MedianNetworkMultiplier)),
					effectiveUnlinkTokenAliasRentalFee:
							uint64.toString(uint64.multiply(unlinkTokenAliasRentalFee, uint64MedianNetworkMultiplier))
				});
				next();
			});
		}).catch(() => {
			res.send(errors.createInvalidArgumentError('there was an error reading the network properties file'));
			next();
		}));
	}
};
