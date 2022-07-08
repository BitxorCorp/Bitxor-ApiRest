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

/** @module plugins/restrictions */
const EntityType = require('../model/EntityType');
const ModelType = require('../model/ModelType');
const sizes = require('../modelBinary/sizes');

const constants = { sizes };

// const accountRestrictionTypeOutgoingOffset = 0x4000;
const accountRestrictionTypeBlockOffset = 0x8000;
const AccountRestrictionTypeFlags = Object.freeze({
	address: 0x0001,
	token: 0x0002,
	operation: 0x0004
});

const accountRestrictionsCreateBaseCodec = valueCodec => ({
	deserialize: parser => {
		const transaction = {};
		transaction.restrictionFlags = parser.uint16();
		const restrictionAdditionsCount = parser.uint8();
		const restrictionDeletionsCount = parser.uint8();
		transaction.accountRestrictionTransactionBody_Reserved1 = parser.uint32();

		transaction.restrictionAdditions = [];
		for (let i = 0; i < restrictionAdditionsCount; ++i)
			transaction.restrictionAdditions.push(valueCodec.deserializeValue(parser));

		transaction.restrictionDeletions = [];
		for (let i = 0; i < restrictionDeletionsCount; ++i)
			transaction.restrictionDeletions.push(valueCodec.deserializeValue(parser));

		return transaction;
	},
	serialize: (transaction, serializer) => {
		serializer.writeUint16(transaction.restrictionFlags);
		serializer.writeUint8(transaction.restrictionAdditions.length);
		serializer.writeUint8(transaction.restrictionDeletions.length);
		serializer.writeUint32(transaction.accountRestrictionTransactionBody_Reserved1);
		transaction.restrictionAdditions.forEach(key => {
			valueCodec.serializeValue(serializer, key);
		});
		transaction.restrictionDeletions.forEach(key => {
			valueCodec.serializeValue(serializer, key);
		});
	}
});

const accountRestrictionTypeDescriptors = [
	{
		entityType: EntityType.accountRestrictionAddress,
		schemaPrefix: 'address',
		valueType: ModelType.binary,
		flag: AccountRestrictionTypeFlags.address
	},
	{
		entityType: EntityType.accountRestrictionToken,
		schemaPrefix: 'token',
		valueType: ModelType.uint64HexIdentifier,
		flag: AccountRestrictionTypeFlags.token
	},
	{
		entityType: EntityType.accountRestrictionOperation,
		schemaPrefix: 'operation',
		valueType: ModelType.uint16,
		flag: AccountRestrictionTypeFlags.operation
	}
];

/**
 * Creates a restrictions plugin.
 * @type {module:plugins/BitxorcorePlugin}
 */
const restrictionsPlugin = {
	AccountRestrictionType: Object.freeze({
		addressAllow: AccountRestrictionTypeFlags.address,
		addressBlock: AccountRestrictionTypeFlags.address + accountRestrictionTypeBlockOffset,
		tokenAllow: AccountRestrictionTypeFlags.token,
		tokenBlock: AccountRestrictionTypeFlags.token + accountRestrictionTypeBlockOffset,
		operationAllow: AccountRestrictionTypeFlags.operation,
		operationBlock: AccountRestrictionTypeFlags.operation + accountRestrictionTypeBlockOffset
	}),

	registerSchema: builder => {
		/**
		 * Account restrictions scope
		 */
		accountRestrictionTypeDescriptors.forEach(restrictionTypeDescriptor => {
			// transaction schemas
			builder.addTransactionSupport(restrictionTypeDescriptor.entityType, {
				restrictionFlags: ModelType.uint16,
				restrictionAdditions: { type: ModelType.array, schemaName: restrictionTypeDescriptor.valueType },
				restrictionDeletions: { type: ModelType.array, schemaName: restrictionTypeDescriptor.valueType }
			});

			// aggregated account restriction subschemas
			builder.addSchema(`accountRestriction.${restrictionTypeDescriptor.schemaPrefix}AccountRestriction`, {
				restrictionFlags: ModelType.uint16,
				values: { type: ModelType.array, schemaName: restrictionTypeDescriptor.valueType }
			});
		});

		// aggregated account restrictions schemas
		builder.addSchema('accountRestrictions', {
			accountRestrictions: { type: ModelType.object, schemaName: 'accountRestriction.restrictions' }
		});
		builder.addSchema('accountRestriction.restrictions', {
			version: ModelType.uint16,
			address: ModelType.encodedAddress,
			restrictions: {
				type: ModelType.array,
				schemaName: entity => {
					for (let i = 0; i < accountRestrictionTypeDescriptors.length; i++) {
						if ((entity.restrictionFlags & 0x3FFF) === accountRestrictionTypeDescriptors[i].flag)
							// the following schemas were added in the previous loop
							return `accountRestriction.${accountRestrictionTypeDescriptors[i].schemaPrefix}AccountRestriction`;
					}
					return 'accountRestriction.fallback';
				}
			}
		});
		builder.addSchema('accountRestriction.fallback', {});

		/**
		 * Token restrictions scope
		 */
		// TokenAddressRestrictionTransaction transaction schema
		builder.addTransactionSupport(EntityType.tokenRestrictionAddress, {
			tokenId: ModelType.uint64HexIdentifier,
			restrictionKey: ModelType.uint64HexIdentifier,
			targetAddress: ModelType.encodedAddress,
			previousRestrictionValue: ModelType.uint64,
			newRestrictionValue: ModelType.uint64
		});

		// TokenGlobalRestrictionTransaction transaction schema
		builder.addTransactionSupport(EntityType.tokenRestrictionGlobal, {
			tokenId: ModelType.uint64HexIdentifier,
			referenceTokenId: ModelType.uint64HexIdentifier,
			restrictionKey: ModelType.uint64HexIdentifier,
			previousRestrictionValue: ModelType.uint64,
			newRestrictionValue: ModelType.uint64,
			previousRestrictionType: ModelType.uint8,
			newRestrictionType: ModelType.uint8
		});

		// token restriction schemas
		builder.addSchema('tokenRestrictions', {
			id: ModelType.objectId,
			tokenRestrictionEntry: { type: ModelType.object, schemaName: 'tokenRestrictions.entry' }
		});
		builder.addSchema('tokenRestrictions.entry', {
			version: ModelType.uint16,
			compositeHash: ModelType.binary,
			entryType: ModelType.uint32,
			tokenId: ModelType.uint64HexIdentifier,
			targetAddress: ModelType.encodedAddress,
			restrictions: { type: ModelType.array, schemaName: 'tokenRestrictions.entry.restrictions' }
		});
		builder.addSchema('tokenRestrictions.entry.restrictions', {
			key: ModelType.uint64,
			value: ModelType.uint64,
			restriction: { type: ModelType.object, schemaName: 'tokenRestrictions.entry.restrictions.restriction' }
		});
		builder.addSchema('tokenRestrictions.entry.restrictions.restriction', {
			referenceTokenId: ModelType.uint64HexIdentifier,
			restrictionValue: ModelType.uint64,
			restrictionType: ModelType.uint8
		});
	},

	registerCodecs: codecBuilder => {
		// account restrictions address
		codecBuilder.addTransactionSupport(
			EntityType.accountRestrictionAddress,
			accountRestrictionsCreateBaseCodec({
				deserializeValue: parser => parser.buffer(constants.sizes.addressDecoded),
				serializeValue: (serializer, value) => serializer.writeBuffer(value)
			})
		);

		// account restrictions token
		codecBuilder.addTransactionSupport(
			EntityType.accountRestrictionToken,
			accountRestrictionsCreateBaseCodec({
				deserializeValue: parser => parser.uint64(),
				serializeValue: (serializer, value) => serializer.writeUint64(value)
			})
		);

		// account restrictions operation
		codecBuilder.addTransactionSupport(
			EntityType.accountRestrictionOperation,
			accountRestrictionsCreateBaseCodec({
				deserializeValue: parser => parser.uint16(),
				serializeValue: (serializer, value) => serializer.writeUint16(value)
			})
		);

		// token restrictions address
		codecBuilder.addTransactionSupport(EntityType.tokenRestrictionAddress, {
			deserialize: parser => {
				const transaction = {};
				transaction.tokenId = parser.uint64();
				transaction.restrictionKey = parser.uint64();
				transaction.previousRestrictionValue = parser.uint64();
				transaction.newRestrictionValue = parser.uint64();
				transaction.targetAddress = parser.buffer(constants.sizes.addressDecoded);
				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeUint64(transaction.tokenId);
				serializer.writeUint64(transaction.restrictionKey);
				serializer.writeUint64(transaction.previousRestrictionValue);
				serializer.writeUint64(transaction.newRestrictionValue);
				serializer.writeBuffer(transaction.targetAddress);
			}
		});

		// token restrictions global
		codecBuilder.addTransactionSupport(EntityType.tokenRestrictionGlobal, {
			deserialize: parser => {
				const transaction = {};
				transaction.tokenId = parser.uint64();
				transaction.referenceTokenId = parser.uint64();
				transaction.restrictionKey = parser.uint64();
				transaction.previousRestrictionValue = parser.uint64();
				transaction.newRestrictionValue = parser.uint64();
				transaction.previousRestrictionType = parser.uint8();
				transaction.newRestrictionType = parser.uint8();
				return transaction;
			},

			serialize: (transaction, serializer) => {
				serializer.writeUint64(transaction.tokenId);
				serializer.writeUint64(transaction.referenceTokenId);
				serializer.writeUint64(transaction.restrictionKey);
				serializer.writeUint64(transaction.previousRestrictionValue);
				serializer.writeUint64(transaction.newRestrictionValue);
				serializer.writeUint8(transaction.previousRestrictionType);
				serializer.writeUint8(transaction.newRestrictionType);
			}
		});
	}
};

module.exports = restrictionsPlugin;
