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

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const optionDefinitions = [
	{
		name: 'help', alias: 'h', type: Boolean, defaultValue: false
	},
	{
		name: 'predefinedRecipients', alias: 'd', type: Number, defaultValue: 0
	},
	{
		name: 'address', alias: 'a', type: String, defaultValue: '127.0.0.1'
	},
	{
		name: 'port', alias: 'p', type: Number, defaultValue: 3000
	},
	{
		name: 'rate', alias: 'r', type: Number, defaultValue: 1
	},
	{
		name: 'total', alias: 't', type: Number, defaultValue: 10
	},
	{
		name: 'mode', alias: 'm', type: String, defaultValue: 'transfer'
	}
];

const sections = [
	{
		header: 'Bitxorcore spammer',
		content: 'Tool to spam a rest server with random transactions.'
	},
	{
		header: 'Options',
		optionList: [
			{
				name: 'mode',
				alias: 'm',
				description: 'Available spamming modes: transfer (default), aggregate'
			},
			{
				name: 'predefinedRecipients',
				alias: 'd',
				description: 'The number of predefined recipients or 0 for random recipients.'
			},
			{
				name: 'address',
				alias: 'a',
				description: 'The host ip address.'
			},
			{
				name: 'port',
				alias: 'p',
				description: 'The port on which to connect.'
			},
			{
				name: 'rate',
				alias: 'r',
				description: 'The desired transaction rate (tx / s).'
			},
			{
				name: 'total',
				alias: 't',
				description: 'The total number of transactions.'
			}
		]
	}
];

module.exports = {
	options: () => commandLineArgs(optionDefinitions),
	usage: () => commandLineUsage(sections)
};
