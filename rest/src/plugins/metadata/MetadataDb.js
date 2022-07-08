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

class MetadataDb {
	/**
	 * Creates MetadataDb around BitxorcoreDb.
	 * @param {module:db/BitxorcoreDb} db Bitxorcore db instance.
	 */
	constructor(db) {
		this.bitxorcoreDb = db;
	}

	/**
	 * Retrieves filtered and paginated metadata.
	 * @param {Uint8Array} sourceAddress Metadata source address
	 * @param {Uint8Array} targetAddress Metadata target address
	 * @param {Uint64} scopedMetadataKey Metadata scoped key
	 * @param {Uint64} targetId Metadata target id
	 * @param {Uint32} metadataType Metadata type
	 * @param {object} options Options for ordering and pagination. Can have an `offset`, and must contain the `sortField`, `sortDirection`,
	 * `pageSize` and `pageNumber`. 'sortField' must be within allowed 'sortingOptions'.
	 * @returns {Promise.<object>} Metadata page.
	 */
	metadata(sourceAddress, targetAddress, scopedMetadataKey, targetId, metadataType, options) {
		const sortingOptions = { id: '_id' };

		let conditions = {};

		const offsetCondition = buildOffsetCondition(options, sortingOptions);
		if (offsetCondition)
			conditions = Object.assign(conditions, offsetCondition);

		if (undefined !== sourceAddress)
			conditions['metadataEntry.sourceAddress'] = Buffer.from(sourceAddress);

		if (undefined !== targetAddress)
			conditions['metadataEntry.targetAddress'] = Buffer.from(targetAddress);

		if (undefined !== scopedMetadataKey)
			conditions['metadataEntry.scopedMetadataKey'] = convertToLong(scopedMetadataKey);

		if (undefined !== targetId)
			conditions['metadataEntry.targetId'] = convertToLong(targetId);

		if (undefined !== metadataType)
			conditions['metadataEntry.metadataType'] = metadataType;

		const sortConditions = { [sortingOptions[options.sortField]]: options.sortDirection };
		return this.bitxorcoreDb.queryPagedDocuments(conditions, [], sortConditions, 'metadata', options);
	}

	metadatasByCompositeHash(ids) {
		const compositeHashes = ids.map(id => Buffer.from(id));
		const conditions = { 'metadataEntry.compositeHash': { $in: compositeHashes } };
		const collection = this.bitxorcoreDb.database.collection('metadata');
		return collection.find(conditions)
			.sort({ _id: -1 })
			.toArray()
			.then(entities => Promise.resolve(this.bitxorcoreDb.sanitizer.renameIds(entities)));
	}
}

module.exports = MetadataDb;
