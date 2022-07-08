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

const tokenRoutes = require('../../../src/plugins/token/tokenRoutes');
const routeUtils = require('../../../src/routes/routeUtils');
const { MockServer } = require('../../routes/utils/routeTestUtils');
const { test } = require('../../routes/utils/routeTestUtils');
const bitxorcore = require('bitxorcore-sdk');
const { expect } = require('chai');
const sinon = require('sinon');

const { address } = bitxorcore.model;

describe('token routes', () => {
	describe('tokens', () => {
		const testAddress = 'NAR3W7B4BCOZSZMFIZRYB3N5YGOUSWIYJCJ6HDA';

		const emptyPageSample = {
			data: [],
			pagination: {
				pageNumber: 1,
				pageSize: 10
			}
		};

		const pageSample = {
			data: [
				{
					id: '',
					token: {
						id: 'random1',
						supply: 1,
						startHeight: '',
						ownerAddress: '',
						revision: 1,
						flags: 3,
						divisibility: 3,
						duration: ''
					}
				},
				{
					id: '',
					token: {
						id: 'random2',
						supply: 1,
						startHeight: '',
						ownerAddress: '',
						revision: 1,
						flags: 3,
						divisibility: 3,
						duration: ''
					}
				}
			],
			pagination: {
				pageNumber: 1,
				pageSize: 10
			}
		};

		const dbTokensFake = sinon.fake(ownerAddress =>
			(ownerAddress ? Promise.resolve(emptyPageSample) : Promise.resolve(pageSample)));

		const services = {
			config: {
				pageSize: {
					min: 10,
					max: 100,
					default: 20
				}
			}
		};

		const mockServer = new MockServer();
		const db = { tokens: dbTokensFake };
		tokenRoutes.register(mockServer.server, db, services);

		beforeEach(() => {
			mockServer.resetStats();
			dbTokensFake.resetHistory();
		});

		describe('GET', () => {
			const route = mockServer.getRoute('/tokens').get();

			it('parses and forwards paging options', () => {
				// Arrange:
				const pagingBag = 'fakePagingBagObject';
				const paginationParser = sinon.stub(routeUtils, 'parsePaginationArguments').returns(pagingBag);
				const req = { params: {} };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(paginationParser.firstCall.args[0]).to.deep.equal(req.params);
					expect(paginationParser.firstCall.args[2]).to.deep.equal({ id: 'objectId' });

					expect(dbTokensFake.calledOnce).to.equal(true);
					expect(dbTokensFake.firstCall.args[1]).to.deep.equal(pagingBag);
					paginationParser.restore();
				});
			});

			it('allowed sort fields are taken into account', () => {
				// Arrange:
				const paginationParserSpy = sinon.spy(routeUtils, 'parsePaginationArguments');
				const expectedAllowedSortFields = { id: 'objectId' };

				// Act:
				return mockServer.callRoute(route, { params: {} }).then(() => {
					// Assert:
					expect(paginationParserSpy.calledOnce).to.equal(true);
					expect(paginationParserSpy.firstCall.args[2]).to.deep.equal(expectedAllowedSortFields);
					paginationParserSpy.restore();
				});
			});

			it('returns empty page if no tokens found', () => {
				// Arrange:
				const req = { params: { ownerAddress: testAddress } };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokensFake.calledOnce).to.equal(true);

					expect(mockServer.send.firstCall.args[0]).to.deep.equal({
						payload: emptyPageSample,
						type: 'tokenDescriptor',
						structure: 'page'
					});
					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('forwards query without ownerAddress if not provided', () => {
				// Arrange:
				const req = { params: {} };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokensFake.calledOnce).to.equal(true);
					expect(dbTokensFake.firstCall.args[0]).to.deep.equal(undefined);

					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('forwards ownerAddress', () => {
				// Arrange:
				const req = { params: { ownerAddress: testAddress } };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokensFake.calledOnce).to.equal(true);
					expect(dbTokensFake.firstCall.args[0]).to.deep.equal(address.stringToAddress(testAddress));

					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('returns page with results', () => {
				// Arrange:
				const req = { params: {} };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokensFake.calledOnce).to.equal(true);
					expect(dbTokensFake.firstCall.args[0]).to.deep.equal(undefined);

					expect(mockServer.send.firstCall.args[0]).to.deep.equal({
						payload: pageSample,
						type: 'tokenDescriptor',
						structure: 'page'
					});
					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('throws error if ownerAddress is invalid', () => {
				// Arrange:
				const req = { params: { ownerAddress: 'AB12345' } };

				// Act + Assert:
				expect(() => mockServer.callRoute(route, req)).to.throw('ownerAddress has an invalid format');
			});
		});
	});

	describe('tokens by id', () => {
		const tokenIds = ['1234567890ABCDEF', 'ABCDEF0123456789'];
		const uint64TokenIds = [[0x90ABCDEF, 0x12345678], [0x23456789, 0xABCDEF01]];
		const errorMessage = 'has an invalid format';
		test.route.document.addGetPostDocumentRouteTests(tokenRoutes.register, {
			routes: { singular: '/tokens/:tokenId', plural: '/tokens' },
			inputs: {
				valid: { object: { tokenId: tokenIds[0] }, parsed: [uint64TokenIds[0]], printable: tokenIds[0] },
				validMultiple: { object: { tokenIds }, parsed: uint64TokenIds },
				invalid: { object: { tokenId: '12345' }, error: `tokenId ${errorMessage}` },
				invalidMultiple: {
					object: { tokenIds: [tokenIds[0], '12345', tokenIds[1]] },
					error: `element in array tokenIds ${errorMessage}`
				}
			},
			dbApiName: 'tokensByIds',
			type: 'tokenDescriptor'
		});
	});
});
