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

const spammerUtils = require('../../src/model/spammerUtils');
const transactionFactory = require('../../src/model/transactionFactory');
const test = require('../testUtils');
const bitxorcore = require('bitxorcore-sdk');
const { expect } = require('chai');

const createKey = bitxorcore.crypto.createKeyPairFromPrivateKeyString;
const modelCodec = bitxorcore.plugins.bitxorcoreModelSystem.configure(['transfer', 'aggregate'], {}).codec;

describe('spammer utils', () => {
	describe('sign and stitch aggregate transaction', () => {
		const createTransaction = signer => transactionFactory.createAggregateTransaction({
			signerPublicKey: signer.publicKey, networkId: 0xA5
		}, []);

		const createRandomKey = () => createKey(
			bitxorcore.utils.convert.uint8ToHex(test.random.bytes(bitxorcore.constants.sizes.signerPublicKey))
		);

		it('adds expected number of cosignatures', () => {
			// Arrange:
			const signerPublicKey = createRandomKey();
			const cosigners = [createRandomKey(), createRandomKey()];
			const transaction = createTransaction(signerPublicKey);

			// Sanity:
			expect(transaction.cosignatures).to.equal(undefined);

			// Act:
			spammerUtils.signAndStitchAggregateTransaction(modelCodec, signerPublicKey, cosigners, transaction);

			// Assert:
			expect(transaction.cosignatures.length).to.equal(cosigners.length);
			cosigners.forEach((keyPair, i) => {
				expect(keyPair.publicKey).to.deep.equal(transaction.cosignatures[i].signerPublicKey);
			});
		});

		it('throws if signer key is in cosigners', () => {
			// Arrange:
			const signerPublicKey = createRandomKey();
			const cosigners = [createRandomKey(), signerPublicKey, createRandomKey()];
			const transaction = createTransaction(signerPublicKey);

			// Act:
			expect(() => spammerUtils.signAndStitchAggregateTransaction(modelCodec, signerPublicKey, cosigners, transaction))
				.to.throw('aggregate signer public key present in list of cosigners');
		});
	});
});
