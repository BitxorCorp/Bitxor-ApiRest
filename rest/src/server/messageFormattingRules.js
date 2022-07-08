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

const { bufferToUnresolvedAddress } = require('../db/dbUtils');
const bitxorcore = require('bitxorcore-sdk');

const { ModelType, status } = bitxorcore.model;
const { convert, uint64 } = bitxorcore.utils;

module.exports = {
	[ModelType.none]: value => value,
	[ModelType.binary]: value => convert.uint8ToHex(value),
	[ModelType.statusCode]: status.toString,
	[ModelType.string]: value => value.toString(),
	[ModelType.uint8]: value => value,
	[ModelType.uint16]: value => value,
	[ModelType.uint32]: value => value,
	[ModelType.uint64]: value => uint64.toString(value),
	[ModelType.uint64HexIdentifier]: value => uint64.toHex(value),
	[ModelType.int]: value => value,
	[ModelType.boolean]: value => value,
	[ModelType.encodedAddress]: value => bufferToUnresolvedAddress(value)
};
