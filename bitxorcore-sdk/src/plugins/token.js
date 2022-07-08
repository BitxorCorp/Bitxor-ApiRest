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

/** @module plugins/token */
const EntityType = require('../model/EntityType');
const ModelType = require('../model/ModelType');
const sizes = require('../modelBinary/sizes');

const constants = { sizes };
/**
 * Creates a token plugin.
 * @type {module:plugins/BitxorcorePlugin}
 */
const tokenPlugin = {
	registerSchema: builder => {
		builder.addTransactionSupport(EntityType.tokenDefinition, {
			id: ModelType.uint64HexIdentifier,
			duration: ModelType.uint64,
			nonce: ModelType.uint32,
			flags: ModelType.uint8,
			divisibility: ModelType.uint8
		});

		builder.addTransactionSupport(EntityType.tokenSupplyChange, {
			tokenId: ModelType.uint64HexIdentifier,
			delta: ModelType.uint64,
			action: ModelType.uint8
		});

		builder.addTransactionSupport(EntityType.tokenSupplyRevocation, {
			sourceAddress: ModelType.encodedAddress,
			tokenId: ModelType.uint64HexIdentifier,
			amount: ModelType.uint64
		});

		builder.addSchema('tokenDescriptor', {
			id: ModelType.objectId,
			token: { type: ModelType.object, schemaName: 'tokenDescriptor.token' }
		});

		builder.addSchema('tokenDescriptor.token', {
			version: ModelType.uint16,
			id: ModelType.uint64HexIdentifier,
			supply: ModelType.uint64,
			startHeight: ModelType.uint64,
			ownerAddress: ModelType.encodedAddress,
			revision: ModelType.int,
			flags: ModelType.uint8,
			divisibility: ModelType.uint8,
			duration: ModelType.uint64
		});
	},

	registerCodecs: codecBuilder => {
		codecBuilder.addTransactionSupport(EntityType.tokenDefinition, {
			deserialize: parser => {
				const transaction = {};
				transaction.id = parser.uint64();
				transaction.duration = parser.uint64();
				transaction.nonce = parser.uint32();
				transaction.flags = parser.uint8();
				transaction.divisibility = parser.uint8();
				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeUint64(transaction.id);
				serializer.writeUint64(transaction.duration);
				serializer.writeUint32(transaction.nonce);
				serializer.writeUint8(transaction.flags);
				serializer.writeUint8(transaction.divisibility);
			}
		});

		codecBuilder.addTransactionSupport(EntityType.tokenSupplyChange, {
			deserialize: parser => {
				const transaction = {};
				transaction.tokenId = parser.uint64();
				transaction.delta = parser.uint64();
				transaction.action = parser.uint8();
				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeUint64(transaction.tokenId);
				serializer.writeUint64(transaction.delta);
				serializer.writeUint8(transaction.action);
			}
		});

		codecBuilder.addTransactionSupport(EntityType.tokenSupplyRevocation, {
			deserialize: parser => {
				const transaction = {};
				transaction.sourceAddress = parser.buffer(constants.sizes.addressDecoded);
				transaction.tokenId = parser.uint64();
				transaction.amount = parser.uint64();
				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeBuffer(transaction.sourceAddress);
				serializer.writeUint64(transaction.tokenId);
				serializer.writeUint64(transaction.amount);
			}
		});
	}
};

module.exports = tokenPlugin;
