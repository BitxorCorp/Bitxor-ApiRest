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

/** @module plugins/lockHash */
const EntityType = require('../model/EntityType');
const ModelType = require('../model/ModelType');
const sizes = require('../modelBinary/sizes');

const constants = { sizes };

/**
 * Creates a lock hash plugin.
 * @type {module:plugins/BitxorcorePlugin}
 */
const lockHashPlugin = {
	registerSchema: builder => {
		builder.addSchema('hashLockInfo', {
			id: ModelType.objectId,
			lock: { type: ModelType.object, schemaName: 'hashLockInfo.lock' }
		});
		builder.addSchema('hashLockInfo.lock', {
			version: ModelType.uint16,
			ownerAddress: ModelType.encodedAddress,
			tokenId: ModelType.uint64HexIdentifier,
			amount: ModelType.uint64,
			endHeight: ModelType.uint64,
			status: ModelType.int,
			hash: ModelType.binary
		});

		builder.addTransactionSupport(EntityType.hashLock, {
			tokenId: ModelType.uint64HexIdentifier,
			amount: ModelType.uint64,
			duration: ModelType.uint64,
			hash: ModelType.binary
		});
	},

	registerCodecs: codecBuilder => {
		codecBuilder.addTransactionSupport(EntityType.hashLock, {
			deserialize: parser => {
				const transaction = {};
				transaction.tokenId = parser.uint64();
				transaction.amount = parser.uint64();
				transaction.duration = parser.uint64();
				transaction.hash = parser.buffer(constants.sizes.hash256);
				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeUint64(transaction.tokenId);
				serializer.writeUint64(transaction.amount);
				serializer.writeUint64(transaction.duration);
				serializer.writeBuffer(transaction.hash);
			}
		});
	}
};

module.exports = lockHashPlugin;
