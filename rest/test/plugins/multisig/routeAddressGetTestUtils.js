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

const { test } = require('../../routes/utils/routeTestUtils');
const bitxorcore = require('bitxorcore-sdk');

const Valid_Address = test.sets.addresses.valid[0];

const routeAddressGetTestUtils = {
	routeDescriptorFactory: traits =>
		dataTraits => ({
			route: traits.route,
			inputs: {
				valid: {
					object: { address: dataTraits.valid },
					parsed: dataTraits.expected,
					printable: dataTraits.valid
				},
				invalid: { object: { address: '12345' }, error: 'address has an invalid format' }
			},
			dbApiName: traits.dbApiName,
			type: traits.dbType
		}),

	addGetDocumentTests: addTests => {
		const Valid_Address_Traits = {
			valid: Valid_Address,
			expected: [[bitxorcore.model.address.stringToAddress(Valid_Address)]]
		};

		describe('by address', () => addTests(Valid_Address_Traits));
	},

	addDefaultTests: traits => {
		const createRouteDescriptor = routeAddressGetTestUtils.routeDescriptorFactory(traits);
		const addGetTests = dataTraits => {
			const routeDescriptor = createRouteDescriptor(dataTraits);

			// Assert:
			test.route.document.addGetDocumentRouteTests(traits.registerRoutes, routeDescriptor);
		};

		routeAddressGetTestUtils.addGetDocumentTests(addGetTests);
	}
};

module.exports = routeAddressGetTestUtils;
