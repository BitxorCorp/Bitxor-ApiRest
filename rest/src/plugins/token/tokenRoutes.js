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

const merkleUtils = require('../../routes/merkleUtils');
const routeUtils = require('../../routes/routeUtils');
const bitxorcore = require('bitxorcore-sdk');

const { PacketType } = bitxorcore.packet;

const { uint64 } = bitxorcore.utils;

module.exports = {
	register: (server, db, services) => {
		const tokenSender = routeUtils.createSender('tokenDescriptor');

		server.get('/tokens', (req, res, next) => {
			const ownerAddress = req.params.ownerAddress ? routeUtils.parseArgument(req.params, 'ownerAddress', 'address') : undefined;

			const options = routeUtils.parsePaginationArguments(req.params, services.config.pageSize, { id: 'objectId' });

			return db.tokens(ownerAddress, options)
				.then(result => tokenSender.sendPage(res, next)(result));
		});

		routeUtils.addGetPostDocumentRoutes(
			server,
			tokenSender,
			{ base: '/tokens', singular: 'tokenId', plural: 'tokenIds' },
			params => db.tokensByIds(params),
			uint64.fromHex
		);

		// this endpoint is here because it is expected to support requests by block other than <current block>
		server.get('/tokens/:tokenId/merkle', (req, res, next) => {
			const tokenId = routeUtils.parseArgument(req.params, 'tokenId',
				'uint64hex');
			const state = PacketType.tokenStatePath;

			return merkleUtils.requestTree(services, state,
				uint64.toBytes(tokenId)).then(response => {
				res.send(response);
				next();
			});
		});
	}
};
