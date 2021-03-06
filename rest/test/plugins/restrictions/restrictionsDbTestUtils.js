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

const RestrictionsDb = require('../../../src/plugins/restrictions/RestrictionsDb');
const dbTestUtils = require('../../db/utils/dbTestUtils');
const test = require('../../testUtils');
const bitxorcore = require('bitxorcore-sdk');
const MongoDb = require('mongodb');

const { EntityType, restriction } = bitxorcore.model;
const { Binary, ObjectId, Long } = MongoDb;

const createRestrictions = restrictions => {
	const restrictionsObject = [];

	let values = [];
	for (let i = 0; i < restrictions.numAddresses; ++i)
		values.push(new Binary(test.random.address()));

	restrictionsObject.push({
		restrictionType: 0.5 > Math.random() ? 1 : 129,
		values
	});

	values = [];
	for (let i = 0; i < restrictions.numTokens; ++i)
		values.push(Math.floor(Math.random() * 1000));

	restrictionsObject.push({
		restrictionType: 0.5 > Math.random() ? 2 : 130,
		values
	});

	values = [];
	for (let i = 0; i < restrictions.numOperations; ++i) {
		const operationTypes = Object.keys(EntityType);
		values.push(EntityType[operationTypes[Math.floor(operationTypes.length * Math.random())]]);
	}

	restrictionsObject.push({
		restrictionType: 0.5 > Math.random() ? 4 : 132,
		values
	});

	return restrictionsObject;
};

const createObjectId = id => new ObjectId(`${'00'.repeat(12)}${id}`.slice(-24));

const restrictionsDbTestUtils = {
	accountDb: {
		createAccountRestrictions: (address, restrictionsDescriptor) => {
			const accountRestrictions = {
				address: new Binary(address),
				restrictions: createRestrictions(restrictionsDescriptor)
			};
			return { _id: dbTestUtils.db.createObjectId(Math.floor(Math.random() * 10000)), meta: {}, accountRestrictions };
		},

		runDbTest: (dbEntities, issueDbCommand, assertDbCommandResult) => dbTestUtils.db.runDbTest(
			dbEntities,
			'accountRestrictions',
			db => new RestrictionsDb(db),
			issueDbCommand,
			assertDbCommandResult
		)
	},

	tokenDb: {
		sanitizeId: entity => { delete entity._id; return entity; },

		createGlobalTokenRestriction: tokenId => ({
			_id: createObjectId(Math.floor(Math.random() * 100000)),
			tokenRestrictionEntry: {
				compositeHash: '',
				entryType: restriction.tokenRestriction.restrictionType.global,
				tokenId: new Long(tokenId[0], tokenId[1]),
				restrictions: [{ key: '', restriction: { referenceTokenId: '', restrictionValue: '', restrictionType: 0 } }]
			}
		}),

		createAddressTokenRestriction: (tokenId, targetAddress) => ({
			_id: createObjectId(Math.floor(Math.random() * 100000)),
			tokenRestrictionEntry: {
				compositeHash: '',
				entryType: restriction.tokenRestriction.restrictionType.address,
				tokenId: new Long(tokenId[0], tokenId[1]),
				targetAddress: new Binary(Buffer.from(targetAddress)),
				restrictions: [{ key: '', value: '' }]
			}
		}),

		runDbTest: (dbEntities, issueDbCommand, assertDbCommandResult) => dbTestUtils.db.runDbTest(
			dbEntities,
			'tokenRestrictions',
			db => new RestrictionsDb(db),
			issueDbCommand,
			assertDbCommandResult
		)
	}
};

Object.assign(restrictionsDbTestUtils, test);

module.exports = restrictionsDbTestUtils;
