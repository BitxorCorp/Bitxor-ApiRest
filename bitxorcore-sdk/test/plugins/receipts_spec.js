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

const ModelSchemaBuilder = require('../../src/model/ModelSchemaBuilder');
const ModelType = require('../../src/model/ModelType');
const receiptsPlugin = require('../../src/plugins/receipts');
const schemaFormatter = require('../../src/utils/schemaFormatter');
const { expect } = require('chai');

describe('receipts plugin', () => {
	describe('register schema', () => {
		it('adds receipts system schema', () => {
			// Arrange:
			const builder = new ModelSchemaBuilder();
			const numDefaultKeys = Object.keys(builder.build()).length;

			// Act:
			receiptsPlugin.registerSchema(builder);
			const modelSchema = builder.build();

			// Assert:
			expect(Object.keys(modelSchema).length).to.equal(numDefaultKeys + 15);
			expect(modelSchema).to.contain.all.keys([
				'addressResolutionStatement',
				'addressResolutionStatement.statement',
				'tokenResolutionStatement',
				'tokenResolutionStatement.statement',
				'transactionStatement',
				'transactionStatement.statement',
				'statement.meta',
				'receipts.balanceChange',
				'receipts.balanceTransfer',
				'receipts.artifactExpiry',
				'receipts.inflation',
				'receipts.entry.address',
				'receipts.entry.token',
				'receipts.unknown',
				'receipts.source'
			]);

			// - addressResolutionStatement
			// - tokenResolutionStatement
			// - transactionStatement
			['addressResolution', 'tokenResolution', 'transaction'].forEach(statementType => {
				expect(Object.keys(modelSchema[`${statementType}Statement`])).deep.equal(['id', 'meta', 'statement']);
				expect(modelSchema[`${statementType}Statement`]).to.contain.all.keys(['statement']);
			});

			// - addressResolutionStatement.statement
			expect(Object.keys(modelSchema['addressResolutionStatement.statement']).length).to.equal(3);
			expect(modelSchema['addressResolutionStatement.statement']).to.contain.all.keys([
				'height',
				'unresolved',
				'resolutionEntries'
			]);

			// - tokenResolutionStatement
			expect(Object.keys(modelSchema['tokenResolutionStatement.statement']).length).to.equal(3);
			expect(modelSchema['tokenResolutionStatement.statement']).to.contain.all.keys([
				'height',
				'unresolved',
				'resolutionEntries'
			]);

			// - transactionStatement
			expect(Object.keys(modelSchema['transactionStatement.statement']).length).to.equal(3);
			expect(modelSchema['transactionStatement.statement']).to.contain.all.keys([
				'height', 'source', 'receipts'
			]);

			// - receipts.entry.address
			expect(Object.keys(modelSchema['receipts.entry.address']).length).to.equal(2);
			expect(modelSchema['receipts.entry.address']).to.contain.all.keys([
				'source', 'resolved'
			]);

			expect(modelSchema['statement.meta']).to.contain.all.keys([
				'timestamp'
			]);

			// - receipts.entry.token
			expect(Object.keys(modelSchema['receipts.entry.token']).length).to.equal(2);
			expect(modelSchema['receipts.entry.token']).to.contain.all.keys([
				'source', 'resolved'
			]);

			// - receipts.balanceChange
			expect(Object.keys(modelSchema['receipts.balanceChange']).length).to.equal(5);
			expect(modelSchema['receipts.balanceChange']).to.contain.all.keys([
				'version', 'type', 'targetAddress', 'tokenId', 'amount'
			]);

			// - receipts.balanceTransfer
			expect(Object.keys(modelSchema['receipts.balanceTransfer']).length).to.equal(6);
			expect(modelSchema['receipts.balanceTransfer']).to.contain.all.keys([
				'version', 'type', 'senderAddress', 'recipientAddress', 'tokenId', 'amount'
			]);

			// - receipts.artifactExpiry
			expect(Object.keys(modelSchema['receipts.artifactExpiry']).length).to.equal(3);
			expect(modelSchema['receipts.artifactExpiry']).to.contain.all.keys([
				'version', 'type', 'artifactId'
			]);

			// - receipts.inflation
			expect(Object.keys(modelSchema['receipts.inflation']).length).to.equal(4);
			expect(modelSchema['receipts.inflation']).to.contain.all.keys([
				'version', 'type', 'tokenId', 'amount'
			]);

			// - receipts.unknown
			expect(Object.keys(modelSchema['receipts.unknown']).length).to.equal(2);
			expect(modelSchema['receipts.unknown']).to.contain.all.keys([
				'version', 'type'
			]);

			// - receipts.source
			expect(Object.keys(modelSchema['receipts.source']).length).to.equal(2);
			expect(modelSchema['receipts.source']).to.contain.all.keys([
				'primaryId', 'secondaryId'
			]);
		});
	});

	describe('conditional schema', () => {
		describe('uses the correct conditional schema depending on receipt type', () => {
			const formatReceipt = receipt => {
				// Arrange:
				const formattingRules = {
					[ModelType.none]: () => 'none',
					[ModelType.binary]: () => 'binary',
					[ModelType.uint64]: () => 'uint64',
					[ModelType.uint64HexIdentifier]: () => 'uint64HexIdentifier',
					[ModelType.objectId]: () => 'objectId',
					[ModelType.string]: () => 'string',
					[ModelType.int]: () => 'int',
					[ModelType.encodedAddress]: () => 'encodedAddress'
				};
				const transactionStatement = {
					statement: {
						height: null,
						source: { primaryId: null, secondaryId: null },
						receipts: [receipt]
					}
				};
				const builder = new ModelSchemaBuilder();

				// Act:
				receiptsPlugin.registerSchema(builder);
				const modelSchema = builder.build();
				const unwrappedFormattedEntity = schemaFormatter.format(
					transactionStatement,
					modelSchema.transactionStatement,
					modelSchema,
					formattingRules
				).statement;

				// Assert
				expect(Object.keys(unwrappedFormattedEntity).length).to.equal(3);
				expect(unwrappedFormattedEntity).to.contain.all.keys(['height', 'source', 'receipts']);
				expect(unwrappedFormattedEntity.receipts.length).to.equal(1);
				return unwrappedFormattedEntity.receipts[0];
			};

			it('formats balance transfer receipt type', () => {
				// Arrange:
				const balanceTransferReceipt = {
					version: 1,
					type: 0x1000,
					senderAddress: null,
					recipientAddress: null,
					tokenId: null,
					amount: null
				};

				// Act:
				const formattedReceipt = formatReceipt(balanceTransferReceipt);

				// Assert:
				expect(formattedReceipt).to.contain.all.keys([
					'version',
					'type',
					'senderAddress',
					'recipientAddress',
					'tokenId',
					'amount'
				]);
			});

			it('formats balance change receipt type', () => {
				// Arrange:
				const balanceChangeReceipt = {
					version: 1,
					type: 0x2000,
					targetAddress: null,
					tokenId: null,
					amount: null
				};

				// Act:
				const formattedReceipt = formatReceipt(balanceChangeReceipt);

				// Assert:
				expect(formattedReceipt).to.contain.all.keys([
					'version',
					'type',
					'targetAddress',
					'tokenId',
					'amount'
				]);
			});

			it('formats artifact expiry receipt type', () => {
				// Arrange:
				const artifactExpiryReceipt = {
					version: 1,
					type: 0x4000,
					artifactId: null
				};

				// Act:
				const formattedReceipt = formatReceipt(artifactExpiryReceipt);

				// Assert:
				expect(formattedReceipt).to.contain.all.keys([
					'version',
					'type',
					'artifactId'
				]);
			});

			it('formats inflation receipt type', () => {
				// Arrange:
				const inflationReceipt = {
					version: 1,
					type: 0x5000,
					tokenId: null,
					amount: null
				};

				// Act:
				const formattedReceipt = formatReceipt(inflationReceipt);

				// Assert:
				expect(formattedReceipt).to.contain.all.keys([
					'version',
					'type',
					'tokenId',
					'amount'
				]);
			});

			it('formats unknown receipt type', () => {
				// Arrange:
				const unknownReceipt = {
					version: null,
					type: 82356235,
					unknownProperty1: null,
					unknownProperty2: null
				};

				// Act:
				const formattedReceipt = formatReceipt(unknownReceipt);

				// Assert:
				expect(formattedReceipt).to.contain.all.keys([
					'version',
					'type'
				]);
			});
		});
	});
});
