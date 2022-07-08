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

const { buildOffsetCondition } = require('../../db/dbUtils');
const MongoDb = require('mongodb');

const { Long } = MongoDb;

class TokenDb {
	/**
	 * Creates TokenDb around BitxorcoreDb.
	 * @param {module:db/BitxorcoreDb} db Bitxorcore db instance.
	 */
	constructor(db) {
		this.bitxorcoreDb = db;
	}

	/**
	 * Retrieves filtered and paginated tokens.
	 * @param {Uint8Array} ownerAddress Token owner address
	 * @param {object} options Options for ordering and pagination. Can have an `offset`, and must contain the `sortField`, `sortDirection`,
	 * `pageSize` and `pageNumber`. 'sortField' must be within allowed 'sortingOptions'.
	 * @returns {Promise.<object>} Tokens page.
	 */
	tokens(ownerAddress, options) {
		const sortingOptions = { id: '_id' };

		let conditions = {};

		const offsetCondition = buildOffsetCondition(options, sortingOptions);
		if (offsetCondition)
			conditions = Object.assign(conditions, offsetCondition);

		if (undefined !== ownerAddress)
			conditions['token.ownerAddress'] = Buffer.from(ownerAddress);

		const sortConditions = { [sortingOptions[options.sortField]]: options.sortDirection };
		return this.bitxorcoreDb.queryPagedDocuments(conditions, [], sortConditions, 'tokens', options);
	}

	/**
	 * Retrieves tokens given their ids.
	 * @param {Array.<module:bitxorcore.utils/uint64~uint64>} ids Token ids.
	 * @returns {Promise.<array>} Tokens.
	 */
	tokensByIds(ids) {
		const tokenIds = ids.map(id => new Long(id[0], id[1]));
		const conditions = { 'token.id': { $in: tokenIds } };
		const collection = this.bitxorcoreDb.database.collection('tokens');
		return collection.find(conditions)
			.sort({ _id: -1 })
			.toArray()
			.then(entities => Promise.resolve(this.bitxorcoreDb.sanitizer.renameIds(entities)));
	}
}

module.exports = TokenDb;
