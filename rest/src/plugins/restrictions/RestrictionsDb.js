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

const { convertToLong, buildOffsetCondition } = require('../../db/dbUtils');

class RestrictionsDb {
	/**
	 * Creates RestrictionsDb around BitxorcoreDb.
	 * @param {module:db/BitxorcoreDb} db Bitxorcore db instance.
	 */
	constructor(db) {
		this.bitxorcoreDb = db;
	}

	/**
	 * Retrieves account restrictions for the given addresses.
	 * @param {array<object>} addresses Given addresses.
	 * @returns {Promise.<array>} Owned account restrictions.
	 */
	accountRestrictionsByAddresses(addresses) {
		const buffers = addresses.map(address => Buffer.from(address));
		const conditions = { 'accountRestrictions.address': { $in: buffers } };
		return this.bitxorcoreDb.queryDocuments('accountRestrictions', conditions);
	}

	/**
	 * Retrieves filtered and paginated token restrictions.
	 * @param {Uint8Array} address Token restriction target address
	 * @param {object} options Options for ordering and pagination. Can have an `offset`, and must contain the `sortField`, `sortDirection`,
	 * `pageSize` and `pageNumber`. 'sortField' must be within allowed 'sortingOptions'.
	 * @returns {Promise.<object>} Token restrictions page.
	 */
	accountRestrictions(address, options) {
		const sortingOptions = { id: '_id' };

		let conditions = {};

		const offsetCondition = buildOffsetCondition(options, sortingOptions);
		if (offsetCondition)
			conditions = Object.assign(conditions, offsetCondition);

		if (undefined !== address)
			conditions['accountRestrictions.address'] = Buffer.from(address);

		const sortConditions = { [sortingOptions[options.sortField]]: options.sortDirection };
		return this.bitxorcoreDb.queryPagedDocuments(conditions, [], sortConditions, 'accountRestrictions', options);
	}

	/**
	 * Retrieves filtered and paginated token restrictions.
	 * @param {Uint64} tokenId Token id
	 * @param {uint} entryType Token restriction type
	 * @param {Uint8Array} targetAddress Token restriction target address
	 * @param {object} options Options for ordering and pagination. Can have an `offset`, and must contain the `sortField`, `sortDirection`,
	 * `pageSize` and `pageNumber`. 'sortField' must be within allowed 'sortingOptions'.
	 * @returns {Promise.<object>} Token restrictions page.
	 */
	tokenRestrictions(tokenId, entryType, targetAddress, options) {
		const sortingOptions = { id: '_id' };

		let conditions = {};

		const offsetCondition = buildOffsetCondition(options, sortingOptions);
		if (offsetCondition)
			conditions = Object.assign(conditions, offsetCondition);

		if (undefined !== tokenId)
			conditions['tokenRestrictionEntry.tokenId'] = convertToLong(tokenId);

		if (undefined !== entryType)
			conditions['tokenRestrictionEntry.entryType'] = entryType;

		if (undefined !== targetAddress)
			conditions['tokenRestrictionEntry.targetAddress'] = Buffer.from(targetAddress);

		const sortConditions = { [sortingOptions[options.sortField]]: options.sortDirection };
		return this.bitxorcoreDb.queryPagedDocuments(conditions, [], sortConditions, 'tokenRestrictions', options);
	}

	tokenRestrictionByCompositeHash(ids) {
		const compositeHashes = ids.map(id => Buffer.from(id));
		const conditions = { 'tokenRestrictionEntry.compositeHash': { $in: compositeHashes } };
		const collection = this.bitxorcoreDb.database.collection('tokenRestrictions');
		return collection.find(conditions)
			.sort({ _id: -1 })
			.toArray()
			.then(entities => Promise.resolve(this.bitxorcoreDb.sanitizer.renameIds(entities)));
	}
}

module.exports = RestrictionsDb;
