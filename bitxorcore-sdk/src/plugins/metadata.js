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

/** @module plugins/metadata */
const EntityType = require('../model/EntityType');
const ModelType = require('../model/ModelType');
const sizes = require('../modelBinary/sizes');
const convert = require('../utils/convert');

const constants = { sizes };

/**
 * Creates a metadata plugin.
 * @type {module:plugins/BitxorcorePlugin}
 */
const metadataPlugin = {
	registerSchema: builder => {
		builder.addTransactionSupport(EntityType.accountMetadata, {
			targetAddress: ModelType.encodedAddress,
			scopedMetadataKey: ModelType.uint64HexIdentifier,
			valueSizeDelta: ModelType.int,
			valueSize: ModelType.uint16,
			value: ModelType.binary
		});

		builder.addTransactionSupport(EntityType.tokenMetadata, {
			targetAddress: ModelType.encodedAddress,
			scopedMetadataKey: ModelType.uint64HexIdentifier,
			targetTokenId: ModelType.uint64HexIdentifier,
			valueSizeDelta: ModelType.int,
			valueSize: ModelType.uint16,
			value: ModelType.binary
		});

		builder.addTransactionSupport(EntityType.namespaceMetadata, {
			targetAddress: ModelType.encodedAddress,
			scopedMetadataKey: ModelType.uint64HexIdentifier,
			targetNamespaceId: ModelType.uint64HexIdentifier,
			valueSizeDelta: ModelType.int,
			valueSize: ModelType.uint16,
			value: ModelType.binary
		});

		builder.addSchema('metadata', {
			id: ModelType.objectId,
			metadataEntry: { type: ModelType.object, schemaName: 'metadataEntry' }
		});

		builder.addSchema('metadataEntry', {
			version: ModelType.uint16,
			compositeHash: ModelType.binary,
			sourceAddress: ModelType.encodedAddress,
			targetAddress: ModelType.encodedAddress,
			scopedMetadataKey: ModelType.uint64HexIdentifier,
			targetId: ModelType.uint64HexIdentifier,
			metadataType: ModelType.int,
			valueSize: ModelType.uint16,
			value: ModelType.binary
		});
	},

	registerCodecs: codecBuilder => {
		codecBuilder.addTransactionSupport(EntityType.accountMetadata, {
			deserialize: parser => {
				const transaction = {};
				transaction.targetAddress = parser.buffer(constants.sizes.addressDecoded);
				transaction.scopedMetadataKey = parser.uint64();
				transaction.valueSizeDelta = convert.uint16ToInt16(parser.uint16());

				const valueSize = parser.uint16();
				transaction.value = 0 < valueSize ? parser.buffer(valueSize) : [];

				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeBuffer(transaction.targetAddress);
				serializer.writeUint64(transaction.scopedMetadataKey);
				serializer.writeUint16(convert.int16ToUint16(transaction.valueSizeDelta));
				serializer.writeUint16(transaction.value.length);
				serializer.writeBuffer(transaction.value);
			}
		});

		codecBuilder.addTransactionSupport(EntityType.tokenMetadata, {
			deserialize: parser => {
				const transaction = {};
				transaction.targetAddress = parser.buffer(constants.sizes.addressDecoded);
				transaction.scopedMetadataKey = parser.uint64();
				transaction.targetTokenId = parser.uint64();
				transaction.valueSizeDelta = convert.uint16ToInt16(parser.uint16());

				const valueSize = parser.uint16();
				transaction.value = 0 < valueSize ? parser.buffer(valueSize) : [];

				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeBuffer(transaction.targetAddress);
				serializer.writeUint64(transaction.scopedMetadataKey);
				serializer.writeUint64(transaction.targetTokenId);
				serializer.writeUint16(convert.int16ToUint16(transaction.valueSizeDelta));
				serializer.writeUint16(transaction.value.length);
				serializer.writeBuffer(transaction.value);
			}
		});

		codecBuilder.addTransactionSupport(EntityType.namespaceMetadata, {
			deserialize: parser => {
				const transaction = {};
				transaction.targetAddress = parser.buffer(constants.sizes.addressDecoded);
				transaction.scopedMetadataKey = parser.uint64();
				transaction.targetNamespaceId = parser.uint64();
				transaction.valueSizeDelta = convert.uint16ToInt16(parser.uint16());

				const valueSize = parser.uint16();
				transaction.value = 0 < valueSize ? parser.buffer(valueSize) : [];

				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeBuffer(transaction.targetAddress);
				serializer.writeUint64(transaction.scopedMetadataKey);
				serializer.writeUint64(transaction.targetNamespaceId);
				serializer.writeUint16(convert.int16ToUint16(transaction.valueSizeDelta));
				serializer.writeUint16(transaction.value.length);
				serializer.writeBuffer(transaction.value);
			}
		});
	}
};

module.exports = metadataPlugin;
