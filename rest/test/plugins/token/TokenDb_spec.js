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

const BitxorcoreDb = require('../../../src/db/BitxorcoreDb');
const TokenDb = require('../../../src/plugins/token/TokenDb');
const test = require('../../db/utils/dbTestUtils');
const bitxorcore = require('bitxorcore-sdk');
const { expect } = require('chai');
const MongoDb = require('mongodb');
const sinon = require('sinon');

const { Binary, Long } = MongoDb;
const { address } = bitxorcore.model;

describe('token db', () => {
	const { createObjectId } = test.db;

	const runTokensDbTest = (dbEntities, issueDbCommand, assertDbCommandResult) =>
		test.db.runDbTest(dbEntities, 'tokens', db => new TokenDb(db), issueDbCommand, assertDbCommandResult);

	describe('tokens', () => {
		const ownerAddressTest1 = address.stringToAddress('SBZ22LWA7GDZLPLQF7PXTMNLWSEZ7ZRVGRMWLXQ');
		const ownerAddressTest2 = address.stringToAddress('NAR3W7B4BCOZSZMFIZRYB3N5YGOUSWIYJCJ6HDA');

		const paginationOptions = {
			pageSize: 10,
			pageNumber: 1,
			sortField: 'id',
			sortDirection: -1
		};

		const createToken = (objectId, tokenId, ownerAddress) => ({
			_id: createObjectId(objectId),
			token: { id: tokenId, ownerAddress: ownerAddress ? Buffer.from(ownerAddress) : undefined }
		});

		const runTestAndVerifyIds = (dbTokens, dbQuery, expectedIds) => {
			const expectedObjectIds = expectedIds.map(id => createObjectId(id));

			return runTokensDbTest(
				dbTokens,
				dbQuery,
				tokensPage => {
					const returnedIds = tokensPage.data.map(t => t.id);
					expect(tokensPage.data.length).to.equal(expectedObjectIds.length);
					expect(returnedIds.sort()).to.deep.equal(expectedObjectIds.sort());
				}
			);
		};

		it('returns expected structure', () => {
			// Arrange:
			const dbTokens = [createToken(10, 100, ownerAddressTest1)];

			// Act + Assert:
			return runTokensDbTest(
				dbTokens,
				db => db.tokens(undefined, paginationOptions),
				page => {
					const expected_keys = ['id', 'token'];
					expect(Object.keys(page.data[0]).sort()).to.deep.equal(expected_keys.sort());
				}
			);
		});

		it('returns empty array for unknown ownerAddress', () => {
			// Arrange:
			const dbTokens = [
				createToken(10, 1, ownerAddressTest1),
				createToken(20, 2, ownerAddressTest1)
			];

			// Act + Assert:
			return runTestAndVerifyIds(dbTokens, db => db.tokens(ownerAddressTest2, paginationOptions), []);
		});

		it('returns filtered tokens by ownerAddress', () => {
			// Arrange:
			const dbTokens = [
				createToken(10, 1, ownerAddressTest1),
				createToken(20, 2, ownerAddressTest2)
			];

			// Act + Assert:
			return runTestAndVerifyIds(dbTokens, db => db.tokens(ownerAddressTest2, paginationOptions), [20]);
		});

		it('returns all the tokens if no ownerAddress provided', () => {
			// Arrange:
			const dbTokens = [
				createToken(10, 1, ownerAddressTest1),
				createToken(20, 2, ownerAddressTest2)
			];

			// Act + Assert:
			return runTestAndVerifyIds(dbTokens, db => db.tokens(undefined, paginationOptions), [10, 20]);
		});

		describe('respects sort conditions', () => {
			// Arrange:
			const dbTokens = () => [
				createToken(10, 20),
				createToken(20, 30),
				createToken(30, 10)
			];

			it('direction ascending', () => {
				const options = {
					pageSize: 10,
					pageNumber: 1,
					sortField: 'id',
					sortDirection: 1
				};

				// Act + Assert:
				return runTokensDbTest(
					dbTokens(),
					db => db.tokens(undefined, options),
					page => {
						expect(page.data[0].id).to.deep.equal(createObjectId(10));
						expect(page.data[1].id).to.deep.equal(createObjectId(20));
						expect(page.data[2].id).to.deep.equal(createObjectId(30));
					}
				);
			});

			it('direction descending', () => {
				const options = {
					pageSize: 10,
					pageNumber: 1,
					sortField: 'id',
					sortDirection: -1
				};

				// Act + Assert:
				return runTokensDbTest(
					dbTokens(),
					db => db.tokens(undefined, options),
					page => {
						expect(page.data[0].id).to.deep.equal(createObjectId(30));
						expect(page.data[1].id).to.deep.equal(createObjectId(20));
						expect(page.data[2].id).to.deep.equal(createObjectId(10));
					}
				);
			});

			it('sort field', () => {
				const queryPagedDocumentsSpy = sinon.spy(BitxorcoreDb.prototype, 'queryPagedDocuments');
				const options = {
					pageSize: 10,
					pageNumber: 1,
					sortField: 'id',
					sortDirection: 1
				};

				// Act + Assert:
				return runTokensDbTest(
					dbTokens(),
					db => db.tokens(undefined, options),
					() => {
						expect(queryPagedDocumentsSpy.calledOnce).to.equal(true);
						expect(Object.keys(queryPagedDocumentsSpy.firstCall.args[2])[0]).to.equal('_id');
						queryPagedDocumentsSpy.restore();
					}
				);
			});
		});

		describe('respects offset', () => {
			// Arrange:
			const dbTokens = () => [
				createToken(10, 20),
				createToken(20, 30),
				createToken(30, 10)
			];
			const options = {
				pageSize: 10,
				pageNumber: 1,
				sortField: 'id',
				sortDirection: 1,
				offset: createObjectId(20)
			};

			it('gt', () => {
				options.sortDirection = 1;

				// Act + Assert:
				return runTestAndVerifyIds(dbTokens(), db => db.tokens(undefined, options), [30]);
			});

			it('lt', () => {
				options.sortDirection = -1;

				// Act + Assert:
				return runTestAndVerifyIds(dbTokens(), db => db.tokens(undefined, options), [10]);
			});
		});
	});

	describe('tokens by ids', () => {
		const createToken = (id, tokenId, ownerAddress, parentId) => {
			const token = {
				ownerAddress: new Binary(ownerAddress),
				id: Long.fromNumber(tokenId),
				namespaceId: Long.fromNumber(parentId)
			};

			return { _id: createObjectId(id), token };
		};

		/*
		 * Creates tokens with ids in the 1000s range, whereas namespace ids will be in the 2000s range
		 */
		const createTokens = (numNamespaces, numTokensPerNamespace) => {
			const ownerAddress = test.random.address();
			const tokens = [];
			let dbId = 0;
			let id = 10000;
			for (let namespaceId = 0; namespaceId < numNamespaces; ++namespaceId) {
				for (let i = 0; i < numTokensPerNamespace; ++i)
					tokens.push(createToken(dbId++, id++, ownerAddress, 20000 + namespaceId));
			}

			return tokens;
		};

		it('returns empty array for unknown token ids', () => {
			// Arrange:
			const tokens = createTokens(3, 4);

			// Assert:
			return runTokensDbTest(
				tokens,
				db => db.tokensByIds([[123, 456]]),
				entities => { expect(entities).to.deep.equal([]); }
			);
		});

		it('returns single matching token', () => {
			// Arrange:
			const tokens = createTokens(3, 4);

			// Assert:
			return runTokensDbTest(
				tokens,
				db => db.tokensByIds([[10010, 0]]),
				entities => {
					expect(entities).to.deep.equal([{ id: createObjectId(10), ...tokens[10] }]);
				}
			);
		});

		it('returns multiple matching tokens', () => {
			// Arrange:
			const tokens = createTokens(3, 4);

			// Assert:
			return runTokensDbTest(
				tokens,
				db => db.tokensByIds([[10010, 0], [10007, 0], [10003, 0]]),
				entities => {
					expect(entities).to.deep.equal([
						{ id: createObjectId(10), ...tokens[10] },
						{ id: createObjectId(7), ...tokens[7] },
						{ id: createObjectId(3), ...tokens[3] }
					]);
				}
			);
		});

		it('returns only known tokens', () => {
			// Arrange:
			const tokens = createTokens(3, 4);

			// Assert:
			return runTokensDbTest(
				tokens,
				db => db.tokensByIds([[10010, 0], [10021, 0], [10003, 0]]),
				entities => expect(entities).to.deep.equal([
					{ id: createObjectId(10), ...tokens[10] },
					{ id: createObjectId(3), ...tokens[3] }
				])
			);
		});
	});
});
