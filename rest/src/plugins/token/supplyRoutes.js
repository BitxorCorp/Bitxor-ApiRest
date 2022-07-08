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

const { longToUint64 } = require('../../db/dbUtils');
const routeUtils = require('../../routes/routeUtils');
const AccountType = require('../AccountType');
const bitxorcore = require('bitxorcore-sdk');
const ini = require('ini');
const fs = require('fs');
const util = require('util');

const { convert, uint64 } = bitxorcore.utils;

module.exports = {
	register: (server, db, services) => {
		const sender = routeUtils.createSender('supply');

		const convertToFractionalWholeUnits = (value, divisibility) => (Number(value) / (10 ** divisibility)).toFixed(divisibility);

		const propertyValueToTokenId = value => uint64.fromHex(value.replace(/'/g, '').replace('0x', ''));

		const readAndParseNetworkPropertiesFile = () => {
			const readFile = util.promisify(fs.readFile);
			return readFile(services.config.apiNode.networkPropertyFilePath, 'utf8')
				.then(fileData => ini.parse(fileData));
		};

		const getTokenProperties = async currencyTokenId => {
			const tokens = await db.tokensByIds([currencyTokenId]);
			return {
				totalSupply: tokens[0].token.supply.toNumber(),
				divisibility: tokens[0].token.divisibility
			};
		};

		const getUncirculatingAccountIds = propertiesObject => {
			const publicKeys = [propertiesObject.network.genesisSignerPublicKey].concat(services.config.uncirculatingAccountPublicKeys);
			return publicKeys.map(publicKey => ({ [AccountType.publicKey]: convert.hexToUint8(publicKey) }));
		};

		const lookupTokenAmount = (tokens, currencyTokenId) => {
			const matchingToken = tokens.find(token => {
				const tokenId = longToUint64(token.id); // convert Long to uint64
				return 0 === uint64.compare(currencyTokenId, tokenId);
			});

			return undefined === matchingToken ? 0 : matchingToken.amount.toNumber();
		};

		server.get('/network/currency/supply/circulating', (req, res, next) => readAndParseNetworkPropertiesFile()
			.then(async propertiesObject => {
				const currencyTokenId = propertyValueToTokenId(propertiesObject.chain.currencyTokenId);
				const currencyTokenProperties = await getTokenProperties(currencyTokenId);

				const accounts = await db.bitxorcoreDb.accountsByIds(getUncirculatingAccountIds(propertiesObject));
				const burnedSupply = accounts.reduce(
					(sum, account) => sum + lookupTokenAmount(account.account.tokens, currencyTokenId),
					0
				);

				sender.sendPlainText(res, next)(convertToFractionalWholeUnits(
					currencyTokenProperties.totalSupply - burnedSupply,
					currencyTokenProperties.divisibility
				));
			}));

		server.get('/network/currency/supply/total', (req, res, next) => readAndParseNetworkPropertiesFile()
			.then(async propertiesObject => {
				const currencyTokenId = propertyValueToTokenId(propertiesObject.chain.currencyTokenId);
				const currencyTokenProperties = await getTokenProperties(currencyTokenId);
				sender.sendPlainText(res, next)(convertToFractionalWholeUnits(
					currencyTokenProperties.totalSupply,
					currencyTokenProperties.divisibility
				));
			}));

		server.get('/network/currency/supply/max', (req, res, next) => readAndParseNetworkPropertiesFile()
			.then(async propertiesObject => {
				const currencyTokenId = propertyValueToTokenId(propertiesObject.chain.currencyTokenId);
				const currencyTokenProperties = await getTokenProperties(currencyTokenId);

				const maxSupply = parseInt(propertiesObject.chain.maxTokenAtomicUnits.replace(/'/g, ''), 10);
				sender.sendPlainText(res, next)(convertToFractionalWholeUnits(maxSupply, currencyTokenProperties.divisibility));
			}));
	}
};
