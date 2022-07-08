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

/** @module plugins/BitxorcoreRestPlugin */

// this file only contains an interface for prettier documentation, so ignore no-unused-vars warnings

/* eslint-disable no-unused-vars */

/**
 * A transaction state descriptor.
 * @typedef {object} TransactionStateDescriptor
 * @property {string} friendlyName Friendly name.
 * @property {string} dbPostfix Database function name postfix.
 * @property {string} routePostfix Route postfix.
 */

/**
 * Adds rest support for a particular subsystem.
 * @interface
 */
module.exports = {
	/**
	 * Creates a plugin specific database.
	 * @instance
	 * @param {module:db/BitxorcoreDb} db Bitxorcore database.
	 */
	createDb: db => {},

	/**
	 * Registers transaction state descriptors.
	 * @instance
	 * @param {array<module:plugins/BitxorcoreRestPlugin~TransactionStateDescriptor>} states Transaction state descriptors.
	 */
	registerTransactionStates: states => {},

	/**
	 * Registers message channels.
	 * @instance
	 * @param {module:connection/MessageChannelBuilder~MessageChannelBuilder} builder Message channel builder.
	 */
	registerMessageChannels: builder => {},

	/**
	 * Registers route extensions.
	 * @instance
	 * @param {...args} args Arguments needed to register the routes.
	 */
	registerRoutes: (...args) => {}
};

/* eslint-enable */
