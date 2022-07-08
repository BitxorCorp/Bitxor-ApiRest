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

/**
 * Bitxorcore model entity types.
 * @enum {numeric}
 * @exports model/EntityType
 */
const EntityType = {
	/** Transfer transaction. */
	transfer: 0x4154,

	/** Register namespace transaction. */
	registerNamespace: 0x414E,

	/** Alias address transaction. */
	aliasAddress: 0x424E,

	/** Alias token transaction. */
	aliasToken: 0x434E,

	/** Token definition transaction. */
	tokenDefinition: 0x414D,

	/** Token supply change transaction. */
	tokenSupplyChange: 0x424D,

	/** Token supply revocation transaction. */
	tokenSupplyRevocation: 0x434d,

	/** Modify multisig account transaction. */
	modifyMultisigAccount: 0x4155,

	/** Aggregate complete transaction. */
	aggregateComplete: 0x4141,

	/** Aggregate bonded transaction. */
	aggregateBonded: 0x4241,

	/** Hash lock transaction. */
	hashLock: 0x4148,

	/** Secret lock transaction. */
	secretLock: 0x4152,

	/** Secret proof transaction. */
	secretProof: 0x4252,

	/** Account address restriction modification transaction. */
	accountRestrictionAddress: 0x4150,

	/** Account token restriction modification transaction. */
	accountRestrictionToken: 0x4250,

	/** Account operation restriction modification transaction. */
	accountRestrictionOperation: 0x4350,

	/** Token address restriction modification transaction. */
	tokenRestrictionAddress: 0x4251,

	/** Token global restriction modification transaction. */
	tokenRestrictionGlobal: 0x4151,

	/** Account link transaction. */
	accountLink: 0x414C,

	/** Node key link transaction. */
	nodeKeyLink: 0x424C,

	/** Voting key link transaction. */
	votingKeyLink: 0x4143,

	/** VRF key link transaction. */
	vrfKeyLink: 0x4243,

	/** Account metadata transaction */
	accountMetadata: 0x4144,

	/** Token metadata transaction */
	tokenMetadata: 0x4244,

	/** Namespace metadata transaction */
	namespaceMetadata: 0x4344
};

module.exports = EntityType;
