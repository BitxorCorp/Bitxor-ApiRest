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

const routeResultTypes = require('../../src/routes/routeResultTypes');
const { expect } = require('chai');

describe('routeResultTypes', () => {
	it('has correct links to schema', () => {
		expect(Object.keys(routeResultTypes).length).to.equal(18);
		expect(routeResultTypes).to.deep.equal({
			account: 'accountWithMetadata',
			block: 'blockHeaderWithMetadata',
			transaction: 'transactionWithMetadata',
			chainInfo: 'chainInfo',
			merkleProofInfo: 'merkleProofInfo',
			finalizationProof: 'finalizationProof',
			metadata: 'metadata',
			stateTree: 'stateTree',
			addressResolutionStatement: 'addressResolutionStatement',
			tokenResolutionStatement: 'tokenResolutionStatement',
			transactionStatement: 'transactionStatement',
			transactionStatus: 'transactionStatus',
			nodeInfo: 'nodeInfo',
			nodeTime: 'nodeTime',
			nodeHealth: 'nodeHealth',
			tokenRestrictions: 'tokenRestrictions',
			serverInfo: 'serverInfo',
			storageInfo: 'storageInfo'
		});
	});
});
