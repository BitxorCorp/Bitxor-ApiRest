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
const restrictions = require('../../../src/plugins/restrictions/restrictions');
const { test } = require('../../routes/utils/routeTestUtils');
const pluginTest = require('../utils/pluginTestUtils');

describe('restrictions plugin', () => {
	pluginTest.assertThat.pluginCreatesDb(restrictions, RestrictionsDb);
	pluginTest.assertThat.pluginDoesNotRegisterAdditionalTransactionStates(restrictions);
	pluginTest.assertThat.pluginDoesNotRegisterAdditionalMessageChannels(restrictions);

	describe('register routes', () => {
		it('registers restrictions GET routes', () => {
			// Arrange:
			const routes = [];
			const server = test.setup.createCapturingMockServer('get', routes);

			// Act:
			restrictions.registerRoutes(server, {}, { network: { name: 'testnet' } });

			// Assert:
			test.assert.assertRoutes(routes, [
				'/restrictions/account',
				'/restrictions/account/:address',
				'/restrictions/account/:address/merkle',
				'/restrictions/token',
				'/restrictions/token/:compositeHash',
				'/restrictions/token/:compositeHash/merkle'
			]);
		});

		it('registers POST routes', () => {
			// Arrange:
			const routes = [];
			const server = test.setup.createCapturingMockServer('post', routes);

			// Act:
			restrictions.registerRoutes(server, {});

			// Assert:
			test.assert.assertRoutes(routes, [
				'/restrictions/account',
				'/restrictions/token'
			]);
		});
	});
});
