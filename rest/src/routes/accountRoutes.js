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

const merkleUtils = require('./merkleUtils');
const routeResultTypes = require('./routeResultTypes');
const routeUtils = require('./routeUtils');
const AccountType = require('../plugins/AccountType');
const errors = require('../server/errors');
const bitxorcore = require('bitxorcore-sdk');

const { PacketType } = bitxorcore.packet;

module.exports = {
	register: (server, db, services) => {
		const sender = routeUtils.createSender(routeResultTypes.account);

		server.get('/accounts', (req, res, next) => {
			const address = req.params.address ? routeUtils.parseArgument(req.params, 'address', 'address') : undefined;
			const tokenId = req.params.tokenId ? routeUtils.parseArgument(req.params, 'tokenId', 'uint64hex') : undefined;

			const offsetParsers = {
				id: 'objectId',
				balance: 'uint64'
			};
			const options = routeUtils.parsePaginationArguments(req.params, services.config.pageSize, offsetParsers);

			if ('balance' === options.sortField && !tokenId)
				throw errors.createInvalidArgumentError('tokenId must be provided when sorting by balance');

			return db.accounts(address, tokenId, options)
				.then(result => sender.sendPage(res, next)(result));
		});

		server.get('/accounts/:accountId', (req, res, next) => {
			const [type, accountId] = routeUtils.parseArgument(req.params, 'accountId', 'accountId');
			return db.accountsByIds([{ [type]: accountId }])
				.then(sender.sendOne(req.params.accountId, res, next));
		});

		server.post('/accounts', (req, res, next) => {
			if (req.params.publicKeys && req.params.addresses)
				throw errors.createInvalidArgumentError('publicKeys and addresses cannot both be provided');

			const idOptions = Array.isArray(req.params.publicKeys)
				? { keyName: 'publicKeys', parserName: 'publicKey', type: AccountType.publicKey }
				: { keyName: 'addresses', parserName: 'address', type: AccountType.address };

			const accountIds = routeUtils.parseArgumentAsArray(req.params, idOptions.keyName, idOptions.parserName);

			return db.accountsByIds(accountIds.map(accountId => ({ [idOptions.type]: accountId })))
				.then(sender.sendArray(idOptions.keyName, res, next));
		});

		// this endpoint is here because it is expected to support requests by block other than <current block>
		server.get('/accounts/:accountId/merkle', (req, res, next) => {
			const [type, accountId] = routeUtils.parseArgument(req.params, 'accountId', 'accountId');
			const encodedAddress = 'publicKey' === type ? bitxorcore.model.address.publicKeyToAddress(accountId, db.networkId) : accountId;
			const state = PacketType.accountStatePath;
			return merkleUtils.requestTree(services, state,
				encodedAddress).then(response => {
				res.send(response);
				next();
			});
		});
	}
};
