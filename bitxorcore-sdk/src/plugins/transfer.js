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

/** @module plugins/transfer */
const EntityType = require('../model/EntityType');
const ModelType = require('../model/ModelType');
const sizes = require('../modelBinary/sizes');

const constants = { sizes };

/**
 * Creates a transfer plugin.
 * @type {module:plugins/BitxorcorePlugin}
 */
const transferPlugin = {
	registerSchema: builder => {
		builder.addTransactionSupport(EntityType.transfer, {
			recipientAddress: ModelType.encodedAddress,
			message: ModelType.binary,
			tokens: { type: ModelType.array, schemaName: 'token' }
		});
	},

	registerCodecs: codecBuilder => {
		codecBuilder.addTransactionSupport(EntityType.transfer, {
			deserialize: parser => {
				const transaction = {};
				transaction.recipientAddress = parser.buffer(constants.sizes.addressDecoded);

				const messageSize = parser.uint16();
				const numTokens = parser.uint8();

				transaction.transferTransactionBody_Reserved1 = parser.uint32();
				transaction.transferTransactionBody_Reserved2 = parser.uint8();

				if (0 < numTokens) {
					transaction.tokens = [];
					while (transaction.tokens.length < numTokens) {
						const id = parser.uint64();
						const amount = parser.uint64();
						transaction.tokens.push({ id, amount });
					}
				}

				if (0 < messageSize)
					transaction.message = parser.buffer(messageSize);

				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeBuffer(transaction.recipientAddress);

				serializer.writeUint16(transaction.message ? transaction.message.length : 0);

				const numTokens = transaction.tokens ? transaction.tokens.length : 0;
				serializer.writeUint8(numTokens);

				serializer.writeUint32(transaction.transferTransactionBody_Reserved1);
				serializer.writeUint8(transaction.transferTransactionBody_Reserved2);

				if (0 < numTokens) {
					transaction.tokens.forEach(token => {
						serializer.writeUint64(token.id);
						serializer.writeUint64(token.amount);
					});
				}

				if (transaction.message)
					serializer.writeBuffer(transaction.message);
			}
		});
	}
};

module.exports = transferPlugin;
