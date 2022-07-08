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

const { uint64 } = bitxorcore.utils;

const parserFromData = binaryData => {
	const parser = new bitxorcore.parser.BinaryParser();
	parser.push(binaryData);
	return parser;
};

const ServerMessageHandler = Object.freeze({
	block: (codec, emit) => (topic, binaryBlock, hash, generationHash) => {
		const block = codec.deserialize(parserFromData(binaryBlock));
		emit({ type: 'blockHeaderWithMetadata', payload: { block, meta: { hash, generationHash } } });
	},

	finalizedBlock: (codec, emit) => (topic, binaryBlock) => {
		const parser = parserFromData(binaryBlock);

		const finalizationEpoch = parser.uint32();
		const finalizationPoint = parser.uint32();
		const height = parser.uint64();
		const hash = parser.buffer(bitxorcore.constants.sizes.hash256);
		emit({
			type: 'finalizedBlock',
			payload: {
				finalizationEpoch, finalizationPoint, height, hash
			}
		});
	},

	transaction: (codec, emit) => (topic, binaryTransaction, hash, merkleComponentHash, height) => {
		const transaction = codec.deserialize(parserFromData(binaryTransaction));
		const meta = { hash, merkleComponentHash, height: uint64.fromBytes(height) };
		emit({ type: 'transactionWithMetadata', payload: { transaction, meta } });
	},

	transactionHash: (codec, emit) => (topic, hash) => {
		emit({ type: 'transactionWithMetadata', payload: { meta: { hash } } });
	},

	transactionStatus: (codec, emit) => (topic, buffer) => {
		const parser = parserFromData(buffer);

		const hash = parser.buffer(bitxorcore.constants.sizes.hash256);
		const deadline = parser.uint64();
		const code = parser.uint32();
		emit({ type: 'transactionStatus', payload: { hash, code, deadline } });
	}
});

module.exports = {
	ServerMessageHandler
};
