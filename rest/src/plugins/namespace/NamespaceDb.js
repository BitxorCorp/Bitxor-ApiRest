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

const { convertToLong, buildOffsetCondition, longToUint64 } = require('../../db/dbUtils');
const bitxorcore = require('bitxorcore-sdk');

const { uint64 } = bitxorcore.utils;

const createLatestConditions = (bitxorcoreDb, height) => {
	if (height) {
		return ({
			$and: [{ 'meta.latest': true }, {
				$or: [
					{ 'namespace.endHeight': convertToLong(-1) },
					{ 'namespace.endHeight': { $gt: height } }]
			}]
		});
	}
	return { 'meta.latest': true };
};

const addActiveFlag = (namespace, height) => {
	if (!namespace)
		return namespace;

	// What about calculated fields in mongo?
	const endHeightUint64 = longToUint64(namespace.namespace.endHeight);
	const heightUint64 = longToUint64(convertToLong(height));
	namespace.meta.active = 1 === uint64.compare(endHeightUint64, heightUint64);
	return namespace;
};

class NamespaceDb {
	/**
	 * Creates NamespaceDb around BitxorcoreDb.
	 * @param {module:db/BitxorcoreDb} db Bitxorcore db instance.
	 */
	constructor(db) {
		this.bitxorcoreDb = db;
	}

	// region namespace retrieval

	/**
	 * Retrieves filtered and paginated namespaces.
	 * @param {Uint32} aliasType Namespace alias type
	 * @param {module:bitxorcore.utils/uint64~uint64} level0 Namespace level0
	 * @param {Uint8Array} ownerAddress Namespace owner address
	 * @param {Uint32} registrationType Namespace registration type
	 * @param {object} options Options for ordering and pagination. Can have an `offset`, and must contain the `sortField`, `sortDirection`,
	 * `pageSize` and `pageNumber`. 'sortField' must be within allowed 'sortingOptions'.
	 * @returns {Promise.<object>} Namespaces page.
	 */
	async namespaces(aliasType, level0, ownerAddress, registrationType, options) {
		const sortingOptions = { id: '_id' };
		let conditions = {};
		const { height } = await this.bitxorcoreDb.chainStatisticCurrent();
		const activeConditions = createLatestConditions(this.bitxorcoreDb);
		const offsetCondition = buildOffsetCondition(options, sortingOptions);
		if (offsetCondition)
			conditions = Object.assign(conditions, offsetCondition);

		if (undefined !== aliasType)
			conditions['namespace.alias.type'] = aliasType;

		if (undefined !== level0)
			conditions['namespace.level0'] = convertToLong(level0);

		if (undefined !== ownerAddress)
			conditions['namespace.ownerAddress'] = Buffer.from(ownerAddress);

		if (undefined !== registrationType)
			conditions['namespace.registrationType'] = registrationType;

		const sortConditions = { [sortingOptions[options.sortField]]: options.sortDirection };
		return this.bitxorcoreDb.queryPagedDocuments({ $and: [activeConditions, conditions] }, [],
			sortConditions, 'namespaces', options, n => addActiveFlag(n, height));
	}

	/**
	 * Retrieves a namespace.
	 * @param {module:bitxorcore.utils/uint64~uint64} id Namespace id.
	 * @returns {Promise.<object>} Namespace.
	 */
	async namespaceById(id) {
		const { height } = await this.bitxorcoreDb.chainStatisticCurrent();
		const activeConditions = createLatestConditions(this.bitxorcoreDb);
		const topLevelConditions = { $or: [] };

		for (let level = 0; 3 > level; ++level) {
			const conditions = [];
			conditions.push(activeConditions);
			conditions.push({ [`namespace.level${level}`]: convertToLong(id) });
			conditions.push({ 'namespace.depth': level + 1 });
			topLevelConditions.$or.push({ $and: conditions });
		}

		return this.bitxorcoreDb.queryDocument('namespaces', topLevelConditions)
			.then(this.bitxorcoreDb.sanitizer.renameId).then(n => addActiveFlag(n, height));
	}

	/**
	 * Retrieves non expired namespaces aliasing tokens or addresses.
	 * @param {Array.<module:bitxorcore.model.namespace/aliasType>} aliasType Alias type.
	 * @param {*} ids Set of token or address ids.
	 * @returns {Promise.<array>} Active namespaces aliasing ids.
	 */
	async activeNamespacesWithAlias(aliasType, ids) {
		const aliasFilterCondition = {
			[bitxorcore.model.namespace.aliasType.token]: () => ({ 'namespace.alias.tokenId': { $in: ids.map(convertToLong) } }),
			[bitxorcore.model.namespace.aliasType.address]: () => ({ 'namespace.alias.address': { $in: ids.map(id => Buffer.from(id)) } })
		};
		const { height } = await this.bitxorcoreDb.chainStatisticCurrent();
		const activeConditions = await createLatestConditions(this.bitxorcoreDb, height);

		const conditions = { $and: [] };
		conditions.$and.push(aliasFilterCondition[aliasType]());
		conditions.$and.push({ 'namespace.alias.type': aliasType });
		conditions.$and.push(activeConditions);

		return this.bitxorcoreDb.queryDocuments('namespaces', conditions).then(ns => ns.map(n => addActiveFlag(n, height)));
	}

	// endregion

	/**
	 * Retrieves transactions that registered the specified namespaces.
	 * @param {Array.<module:bitxorcore.utils/uint64~uint64>} namespaceIds Namespace ids.
	 * @returns {Promise.<array>} Register namespace transactions.
	 */
	registerNamespaceTransactionsByNamespaceIds(namespaceIds) {
		const type = bitxorcore.model.EntityType.registerNamespace;
		const conditions = { $and: [] };
		conditions.$and.push({ 'transaction.id': { $in: namespaceIds } });
		conditions.$and.push({ 'transaction.type': type });
		return this.bitxorcoreDb.queryDocuments('transactions', conditions);
	}
}

module.exports = NamespaceDb;
