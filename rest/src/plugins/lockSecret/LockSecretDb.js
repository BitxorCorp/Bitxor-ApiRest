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

class LockSecretDb {
	/**
	 * Creates LockSecretDb around BitxorcoreDb.
	 * @param {module:db/BitxorcoreDb} db Bitxorcore db instance.
	 */
	constructor(db) {
		this.bitxorcoreDb = db;
	}

	// region lock retrieval

	/**
	 * Retrieves secret infos for given accounts filtered and paginated.
	 * @param {array<{Uint8Array}>} addresses Account addresses.
	 * @param {Uint8Array} secret Secret hash.
	 * @param {object} options Options for ordering and pagination. Can have an `offset`, and must contain the `sortField`, `sortDirection`,
	 * `pageSize` and `pageNumber`. 'sortField' must be within allowed 'sortingOptions'.
	 * @returns {Promise.<array>} Secret lock infos for all accounts.
	 */
	secretLocks(addresses, secret, options) {
		const sortingOptions = { id: '_id' };
		const buffers = addresses.map(address => Buffer.from(address));
		let conditions = {};

		if (addresses.length)
			conditions['lock.ownerAddress'] = { $in: buffers };

		if (undefined !== secret)
			conditions['lock.secret'] = Buffer.from(secret);

		const offsetCondition = buildOffsetCondition(options, sortingOptions);
		if (offsetCondition)
			conditions = Object.assign(conditions, offsetCondition);

		const sortConditions = { [sortingOptions[options.sortField]]: options.sortDirection };
		return this.bitxorcoreDb.queryPagedDocuments(conditions, [], sortConditions, 'secretLocks', options);
	}

	secretLocksByCompositeHash(ids) {
		const compositeHashes = ids.map(id => Buffer.from(id));
		const conditions = { 'lock.compositeHash': { $in: compositeHashes } };
		const collection = this.bitxorcoreDb.database.collection('secretLocks');
		return collection.find(conditions)
			.sort({ _id: -1 })
			.toArray()
			.then(entities => Promise.resolve(this.bitxorcoreDb.sanitizer.renameIds(entities)));
	}

	// endregion
}

module.exports = LockSecretDb;
