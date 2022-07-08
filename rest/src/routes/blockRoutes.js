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

const dbFacade = require('./dbFacade');
const routeResultTypes = require('./routeResultTypes');
const routeUtils = require('./routeUtils');
const bitxorcore = require('bitxorcore-sdk');

const { uint64 } = bitxorcore.utils;

module.exports = {
	register: (server, db, services) => {
		server.get('/blocks', (req, res, next) => {
			const { params } = req;

			const signerPublicKey = params.signerPublicKey ? routeUtils.parseArgument(params, 'signerPublicKey', 'publicKey') : undefined;
			const beneficiaryAddress = params.beneficiaryAddress
				? routeUtils.parseArgument(params, 'beneficiaryAddress', 'address')
				: undefined;

			const offsetParsers = {
				id: 'objectId',
				height: 'uint64'
			};
			const options = routeUtils.parsePaginationArguments(params, services.config.pageSize, offsetParsers);

			return db.blocks(signerPublicKey, beneficiaryAddress, options)
				.then(result => routeUtils.createSender(routeResultTypes.block).sendPage(res, next)(result));
		});

		server.get('/blocks/:height', (req, res, next) => {
			const height = routeUtils.parseArgument(req.params, 'height', 'uint64');

			return dbFacade.runHeightDependentOperation(db, height, () => db.blockAtHeight(height))
				.then(result => result.payload)
				.then(routeUtils.createSender(routeResultTypes.block).sendOne(uint64.toString(height), res, next));
		});

		server.get(
			'/blocks/:height/transactions/:hash/merkle',
			routeUtils.blockRouteMerkleProcessor(db, 'transactionsCount', 'transactionMerkleTree')
		);
	}
};
