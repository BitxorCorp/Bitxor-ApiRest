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

const { convert } = bitxorcore.utils;
const { constants } = bitxorcore;

module.exports = {
	register: (server, db, services) => {
		routeUtils.addGetPostDocumentRoutes(
			server,
			routeUtils.createSender(routeResultTypes.transactionStatus),
			{ base: '/transactionStatus', singular: 'hash', plural: 'hashes' },
			params => dbFacade.transactionStatusesByHashes(db, params, services.config.transactionStates),
			hash => {
				if (2 * constants.sizes.hash256 === hash.length)
					return convert.hexToUint8(hash);

				throw Error(`invalid length of hash '${hash.length}'`);
			}
		);
	}
};
