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

const bitxorcore = require('bitxorcore-sdk');

module.exports = {
	signAndStitchAggregateTransaction: (codec, aggregateSignerKeyPair, keyPairs, transaction) => {
		// note: signed data does not contain cosignatures because transaction does not contain them
		const { transactionExtensions } = bitxorcore.modelBinary;
		transactionExtensions.sign(codec, aggregateSignerKeyPair, transaction);
		const aggregateHash = transactionExtensions.hash(codec, transaction);

		if (keyPairs.find(keyPair => aggregateSignerKeyPair.publicKey === keyPair.publicKey))
			throw Error('aggregate signer public key present in list of cosigners');

		transaction.cosignatures = keyPairs.map(keyPair => ({
			signerPublicKey: keyPair.publicKey,
			signature: bitxorcore.crypto.sign(keyPair, aggregateHash)
		}));
	}
};
