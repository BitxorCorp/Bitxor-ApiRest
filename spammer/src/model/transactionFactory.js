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

const networkTime = require('../utils/networkTime');
const random = require('../utils/random');
const bitxorcore = require('bitxorcore-sdk');

const { uint64 } = bitxorcore.utils;

const createTransaction = (options, type) => ({
	verifiableEntityHeader_Reserved1: 0,
	signature: new Uint8Array(bitxorcore.constants.sizes.signature),
	signerPublicKey: options.signerPublicKey,
	entityBody_Reserved1: 0,
	version: 1,
	network: options.networkId,
	type,
	transactionsHash: new Uint8Array(bitxorcore.constants.sizes.hash256),
	aggregateTransactionHeader_Reserved1: 0,
	maxFee: uint64.fromUint(0),
	deadline: uint64.fromUint(networkTime.getNetworkTime() + (60 * 60 * 1000))
});

module.exports = {
	createRandomTransfer: (options, recipientSelector) => Object.assign(createTransaction(options, bitxorcore.model.EntityType.transfer), {
		recipientAddress: recipientSelector(),
		message: Buffer.from(uint64.toHex(uint64.fromUint(options.transferId)), 'hex'),
		tokens: [
			{ id: [0xD95FCF29, 0xD525AD41],	amount: uint64.fromUint(random.uint32(1000000)) }
		]
	}),

	createAggregateTransaction: (options, transactions) => Object.assign(
		createTransaction(options, bitxorcore.model.EntityType.aggregateComplete),
		{ transactions }
	)
};
