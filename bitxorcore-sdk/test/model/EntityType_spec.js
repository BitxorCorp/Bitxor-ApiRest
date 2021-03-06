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

const EntityType = require('../../src/model/EntityType');
const { expect } = require('chai');

describe('entity type enumeration', () => {
	it('exposes expected types', () => {
		// Assert:
		expect(EntityType).to.deep.equal({
			transfer: 0x4154,
			registerNamespace: 0x414E,
			aliasAddress: 0x424E,
			aliasToken: 0x434E,
			tokenDefinition: 0x414D,
			tokenSupplyChange: 0x424D,
			tokenSupplyRevocation: 0x434d,
			modifyMultisigAccount: 0x4155,
			aggregateComplete: 0x4141,
			aggregateBonded: 0x4241,
			hashLock: 0x4148,
			secretLock: 0x4152,
			secretProof: 0x4252,
			accountRestrictionAddress: 0x4150,
			accountRestrictionToken: 0x4250,
			accountRestrictionOperation: 0x4350,
			tokenRestrictionAddress: 0x4251,
			tokenRestrictionGlobal: 0x4151,
			accountLink: 0x414C,
			nodeKeyLink: 0x424C,
			votingKeyLink: 0x4143,
			vrfKeyLink: 0x4243,
			accountMetadata: 0x4144,
			tokenMetadata: 0x4244,
			namespaceMetadata: 0x4344
		});
	});

	it('exposed values are unique', () => {
		// Act:
		const reverseMapping = Object.keys(EntityType).reduce((state, name) => {
			state[EntityType[name]] = name;
			return state;
		}, {});

		// Assert:
		expect(Object.keys(EntityType).length).to.equal(Object.keys(reverseMapping).length);
	});
});
