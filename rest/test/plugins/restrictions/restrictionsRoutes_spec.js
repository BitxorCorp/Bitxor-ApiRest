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

const restrictionsRoutes = require('../../../src/plugins/restrictions/restrictionsRoutes');
const routeResultTypes = require('../../../src/routes/routeResultTypes');
const routeUtils = require('../../../src/routes/routeUtils');
const { MockServer } = require('../../routes/utils/routeTestUtils');
const { test } = require('../../routes/utils/routeTestUtils');
const bitxorcore = require('bitxorcore-sdk');
const { expect } = require('chai');
const sinon = require('sinon');

const { address } = bitxorcore.model;
const { addresses } = test.sets;

describe('restrictions routes', () => {
	describe('account restrictions', () => {
		describe('by address', () => {
			const parsedAddresses = addresses.valid.map(address.stringToAddress);
			test.route.document.addGetPostDocumentRouteTests(restrictionsRoutes.register, {
				routes: { singular: '/restrictions/account/:address', plural: '/restrictions/account' },
				inputs: {
					valid: { object: { address: addresses.valid[0] }, parsed: [parsedAddresses[0]], printable: addresses.valid[0] },
					validMultiple: { object: { addresses: addresses.valid }, parsed: parsedAddresses },
					invalid: { object: { address: '12345' }, error: 'address has an invalid format' },
					invalidMultiple: {
						object: { addresses: [addresses.valid[0], '12345'] },
						error: 'element in array addresses has an invalid format'
					}
				},

				dbApiName: 'accountRestrictionsByAddresses',
				type: 'accountRestrictions'
			});
		});
	});

	describe('token restrictions', () => {
		const testTokenId = '0DC67FBE1CAD29E3';
		const testTokenIdParsed = [0x1CAD29E3, 0x0DC67FBE];
		const testAddress = 'SBZ22LWA7GDZLPLQF7PXTMNLWSEZ7ZRVGRMWLXQ';

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
					tokenRestrictionEntry: {
						compositeHash: '',
						entryType: 0,
						tokenId: '',
						targetAddress: '',
						restrictions: []
					}
				},
				{
					id: '',
					tokenRestrictionEntry: {
						compositeHash: '',
						entryType: 1,
						tokenId: '',
						restrictions: []
					}
				}
			],
			pagination: {
				pageNumber: 1,
				pageSize: 10
			}
		};

		const dbTokenRestrictionsFake = sinon.fake(tokenId =>
			(tokenId ? Promise.resolve(emptyPageSample) : Promise.resolve(pageSample)));

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
		const db = { tokenRestrictions: dbTokenRestrictionsFake };
		restrictionsRoutes.register(mockServer.server, db, services);

		beforeEach(() => {
			mockServer.resetStats();
			dbTokenRestrictionsFake.resetHistory();
		});

		describe('GET', () => {
			const route = mockServer.getRoute('/restrictions/token').get();

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

					expect(dbTokenRestrictionsFake.calledOnce).to.equal(true);
					expect(dbTokenRestrictionsFake.firstCall.args[3]).to.deep.equal(pagingBag);
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

			it('returns empty page if no restrictions found', () => {
				// Arrange:
				const req = { params: { tokenId: testTokenId } };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokenRestrictionsFake.calledOnce).to.equal(true);

					expect(mockServer.send.firstCall.args[0]).to.deep.equal({
						payload: emptyPageSample,
						type: routeResultTypes.tokenRestrictions,
						structure: 'page'
					});
					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('forwards tokenId', () => {
				// Arrange:
				const req = { params: { tokenId: testTokenId } };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokenRestrictionsFake.calledOnce).to.equal(true);
					expect(dbTokenRestrictionsFake.firstCall.args[0]).to.deep.equal(testTokenIdParsed);

					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('forwards entryType', () => {
				// Arrange:
				const req = { params: { entryType: '0' } };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokenRestrictionsFake.calledOnce).to.equal(true);
					expect(dbTokenRestrictionsFake.firstCall.args[1]).to.equal(0);

					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('forwards targetAddress', () => {
				// Arrange:
				const req = { params: { targetAddress: testAddress } };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokenRestrictionsFake.calledOnce).to.equal(true);
					expect(dbTokenRestrictionsFake.firstCall.args[2]).to.deep.equal(address.stringToAddress(testAddress));

					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('returns page with results', () => {
				// Arrange:
				const req = { params: {} };

				// Act:
				return mockServer.callRoute(route, req).then(() => {
					// Assert:
					expect(dbTokenRestrictionsFake.calledOnce).to.equal(true);
					expect(dbTokenRestrictionsFake.firstCall.args[0]).to.deep.equal(undefined);

					expect(mockServer.send.firstCall.args[0]).to.deep.equal({
						payload: pageSample,
						type: routeResultTypes.tokenRestrictions,
						structure: 'page'
					});
					expect(mockServer.next.calledOnce).to.equal(true);
				});
			});

			it('throws error if tokenId is invalid', () => {
				// Arrange:
				const req = { params: { tokenId: '12345' } };

				// Act + Assert:
				expect(() => mockServer.callRoute(route, req)).to.throw('tokenId has an invalid format');
			});

			it('throws error if entryType is invalid', () => {
				// Arrange:
				const req = { params: { entryType: '-1' } };

				// Act + Assert:
				expect(() => mockServer.callRoute(route, req)).to.throw('entryType has an invalid format');
			});

			it('throws error if targetAddress is invalid', () => {
				// Arrange:
				const req = { params: { targetAddress: 'AB12345' } };

				// Act + Assert:
				expect(() => mockServer.callRoute(route, req)).to.throw('targetAddress has an invalid format');
			});

			describe('by compositeHash', () => {
				const compositeHashes = ['C54AFD996DF1F52748EBC5B40F8D0DC242A6A661299149F5F96A0C21ECCB653F'];
				const parsedCompositeHashes = compositeHashes.map(routeUtils.namedParserMap.hash256);
				test.route.document.addGetPostDocumentRouteTests(restrictionsRoutes.register, {
					routes: { singular: '/restrictions/token/:compositeHash', plural: '/restrictions/token' },
					inputs: {
						valid: {
							object: { compositeHash: compositeHashes[0] },
							parsed: [parsedCompositeHashes[0]],
							printable: compositeHashes[0]
						},
						validMultiple: { object: { compositeHashes }, parsed: parsedCompositeHashes },
						invalid: { object: { compositeHash: '12345' }, error: 'compositeHash has an invalid format' },
						invalidMultiple: {
							object: { compositeHashes: [compositeHashes[0], '12345'] },
							error: 'element in array compositeHashes has an invalid format'
						}
					},

					dbApiName: 'tokenRestrictionByCompositeHash',
					type: 'tokenRestrictions'
				});
			});
		});
	});
});
