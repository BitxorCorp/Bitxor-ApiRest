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

/** @module plugins/bitxorcoreModelSystem */
const accountLink = require('./accountLink');
const aggregate = require('./aggregate');
const lockHash = require('./lockHash');
const lockSecret = require('./lockSecret');
const metadata = require('./metadata');
const token = require('./token');
const multisig = require('./multisig');
const namespace = require('./namespace');
const receipts = require('./receipts');
const restrictions = require('./restrictions');
const transfer = require('./transfer');
const ModelFormatterBuilder = require('../model/ModelFormatterBuilder');
const ModelSchemaBuilder = require('../model/ModelSchemaBuilder');
const ModelCodecBuilder = require('../modelBinary/ModelCodecBuilder');

const plugins = {
	accountLink,
	aggregate,
	lockHash,
	lockSecret,
	metadata,
	token,
	multisig,
	namespace,
	receipts,
	restrictions,
	transfer
};

/**
 * A complete bitxorcore model system.
 * @class BitxorcoreModelSystem
 *
 * @property {object} schema Complete schema information.
 */
const bitxorcoreModelSystem = {
	/**
	 * Gets the names of all supported plugins.
	 * @returns {array<string>} Names of all supported plugins.
	 */
	supportedPluginNames: () => Object.keys(plugins),

	/**
	 * Builds a bitxorcore model system with the specified extensions.
	 * @param {array} pluginNames Additional extensions to use.
	 * @param {object} namedFormattingRules A dictionary containing named sets of formatting rules.
	 * @returns {module:plugins/bitxorcoreModelSystem} Configured bitxorcore model system.
	 */
	configure: (pluginNames, namedFormattingRules) => {
		const schemaBuilder = new ModelSchemaBuilder();
		const codecBuilder = new ModelCodecBuilder();
		const formatterBuilder = new ModelFormatterBuilder();
		pluginNames.forEach(pluginName => {
			if (!plugins[pluginName])
				throw Error(`plugin '${pluginName}' not supported by model system`);

			const plugin = plugins[pluginName];
			plugin.registerSchema({
				addTransactionSupport: (transactionType, schema) => {
					schemaBuilder.addTransactionSupport(transactionType, schema);
					formatterBuilder.addFormatter(schemaBuilder.typeToName(transactionType));
				},
				addSchema: (name, schema) => {
					schemaBuilder.addSchema(name, schema);
					formatterBuilder.addFormatter(name);
				}
			});
			plugin.registerCodecs(codecBuilder);
		});

		const modelSchema = schemaBuilder.build();
		const formatters = {};
		Object.keys(namedFormattingRules).forEach(key => {
			formatters[key] = formatterBuilder.build(modelSchema, namedFormattingRules[key]);
		});

		return {
			schema: modelSchema,
			codec: codecBuilder.build(),
			formatters
		};
	}
};

module.exports = bitxorcoreModelSystem;
