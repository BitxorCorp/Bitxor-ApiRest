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

/** @module modelBinary/verifiableEntityCodec */
const sizes = require('./sizes');

const constants = { sizes };

const verifiableEntityCodec = {
	/**
	 * Parses a verifiable entity.
	 * @param {object} parser Parser.
	 * @returns {object} Parsed entity.
	 */
	deserialize: parser => {
		const entity = {};
		entity.verifiableEntityHeader_Reserved1 = parser.uint32();
		entity.signature = parser.buffer(constants.sizes.signature);
		entity.signerPublicKey = parser.buffer(constants.sizes.signerPublicKey);
		entity.entityBody_Reserved1 = parser.uint16();
		entity.entityBody_Reserved2 = parser.uint8();
		entity.version = parser.uint8();
		entity.network = parser.uint16();
		entity.type = parser.uint16();
		return entity;
	},

	/**
	 * Serializes a verifiable entity.
	 * @param {object} entity Entity.
	 * @param {object} serializer Serializer.
	 */
	serialize: (entity, serializer) => {
		serializer.writeUint32(entity.verifiableEntityHeader_Reserved1);
		serializer.writeBuffer(entity.signature);
		serializer.writeBuffer(entity.signerPublicKey);
		serializer.writeUint16(entity.entityBody_Reserved1);
		serializer.writeUint8(entity.entityBody_Reserved2);
		serializer.writeUint8(entity.version);
		serializer.writeUint16(entity.network);
		serializer.writeUint16(entity.type);
	}
};

module.exports = verifiableEntityCodec;
