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

const EntityType = require('../../src/model/EntityType');
const ModelSchemaBuilder = require('../../src/model/ModelSchemaBuilder');
const token = require('../../src/plugins/token');
const test = require('../binaryTestUtils');
const { expect } = require('chai');

const constants = {
	sizes: {
		tokenDefinition: 22,
		tokenSupplyChange: 17,
		tokenSupplyRevocation: 40
	}
};

describe('token plugin', () => {
	describe('register schema', () => {
		it('adds token system schema', () => {
			// Arrange:
			const builder = new ModelSchemaBuilder();
			const numDefaultKeys = Object.keys(builder.build()).length;

			// Act:
			token.registerSchema(builder);
			const modelSchema = builder.build();

			// Assert:
			expect(Object.keys(modelSchema).length).to.equal(numDefaultKeys + 5);
			expect(modelSchema).to.contain.all.keys(
				'tokenDefinition',
				'tokenSupplyChange',
				'tokenSupplyRevocation',
				'tokenDescriptor',
				'tokenDescriptor.token'
			);

			// - token definition
			expect(Object.keys(modelSchema.tokenDefinition).length).to.equal(Object.keys(modelSchema.transaction).length + 5);
			expect(modelSchema.tokenDefinition).to.contain.all.keys(
				['id', 'duration', 'nonce', 'flags', 'divisibility']
			);

			// - token supply change
			expect(Object.keys(modelSchema.tokenSupplyChange).length).to.equal(Object.keys(modelSchema.transaction).length + 3);
			expect(modelSchema.tokenSupplyChange).to.contain.all.keys(['tokenId', 'delta', 'action']);

			// - token descriptor
			expect(Object.keys(modelSchema.tokenDescriptor).length).to.equal(2);
			expect(modelSchema.tokenDescriptor).to.contain.all.keys(['id', 'token']);

			// - token descriptor token
			expect(Object.keys(modelSchema['tokenDescriptor.token']).length).to.equal(9);
			expect(modelSchema['tokenDescriptor.token']).to.contain.all.keys([
				'version', 'id', 'supply', 'startHeight', 'ownerAddress', 'revision', 'flags', 'divisibility', 'duration'
			]);
		});
	});

	describe('register codecs', () => {
		const getCodecs = () => {
			const codecs = {};
			token.registerCodecs({
				addTransactionSupport: (type, codec) => { codecs[type] = codec; }
			});

			return codecs;
		};

		it('adds token codecs', () => {
			// Act:
			const codecs = getCodecs();

			// Assert: codecs were registered
			expect(Object.keys(codecs).length).to.equal(3);
			expect(codecs).to.contain.all.keys([
				EntityType.tokenDefinition.toString(),
				EntityType.tokenSupplyChange.toString(),
				EntityType.tokenSupplyRevocation.toString()
			]);
		});

		const getCodec = entityType => getCodecs()[entityType];

		describe('supports token definition', () => {
			const generateTransaction = () => ({
				buffer: Buffer.concat([
					Buffer.of(0xF2, 0x26, 0x6C, 0x06, 0x40, 0x83, 0xB2, 0x92), // token id
					Buffer.of(0xFA, 0x62, 0xCC, 0x56, 0x42, 0x37, 0xBB, 0xD2), // duration
					Buffer.of(0x06, 0xFF, 0xCA, 0xB8), // token nonce
					Buffer.of(0x11), // flags
					Buffer.of(0x66) // divisibility
				]),

				object: {
					id: [0x066C26F2, 0x92B28340],
					duration: [0x56CC62FA, 0xD2BB3742],
					nonce: 3100311302,
					flags: 0x11,
					divisibility: 0x66
				}
			});

			test.binary.test.addAll(getCodec(EntityType.tokenDefinition), constants.sizes.tokenDefinition, generateTransaction);
		});

		describe('supports token supply change', () => {
			const generateTransaction = () => ({
				buffer: Buffer.concat([
					Buffer.of(0xF2, 0x26, 0x6C, 0x06, 0x40, 0x83, 0xB2, 0x92), // token id
					Buffer.of(0xCA, 0xD0, 0x8E, 0x6E, 0xFF, 0x21, 0x2F, 0x49), // delta
					Buffer.of(0x01) // action
				]),

				object: {
					tokenId: [0x066C26F2, 0x92B28340],
					delta: [0x6E8ED0CA, 0x492F21FF],
					action: 0x01
				}
			});

			test.binary.test.addAll(getCodec(EntityType.tokenSupplyChange), constants.sizes.tokenSupplyChange, generateTransaction);
		});

		describe('supports token supply revokation', () => {
			const sourceAddressBuffer = test.random.bytes(test.constants.sizes.addressDecoded);
			const generateTransaction = () => ({
				buffer: Buffer.concat([
					sourceAddressBuffer, // source address
					Buffer.of(0xF2, 0x26, 0x6C, 0x06, 0x40, 0x83, 0xB2, 0x92), // token id
					Buffer.of(0xCA, 0xD0, 0x8E, 0x6E, 0xFF, 0x21, 0x2F, 0x49) // amount
				]),

				object: {
					sourceAddress: sourceAddressBuffer,
					tokenId: [0x066C26F2, 0x92B28340],
					amount: [0x6E8ED0CA, 0x492F21FF]
				}
			});

			test.binary.test.addAll(getCodec(EntityType.tokenSupplyRevocation),
				constants.sizes.tokenSupplyRevocation, generateTransaction);
		});
	});
});
