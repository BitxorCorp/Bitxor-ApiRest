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
/* eslint-disable */
const errors = require('../server/errors');
const bitxorcore = require('bitxorcore-sdk');
const MerkleTree = require('./MerkelTree');

const packetHeader = bitxorcore.packet.header;
const { StatePathPacketTypes } = bitxorcore.packet;
const { convert } = bitxorcore.utils;

const merkleUtils = {
	/**
	 * It sends a merkle tree request to api server for the give state path and key.
	 *
	 * @param {service} services the service object used to call bitxorcore api
	 * @param {PacketType} state the state path packet type from {StatePathPacketTypes}
	 * @param {Uint8Array} key the state identifier as byte array.
	 * @returns {Promise<{formatter: string, payload: *, type: *}>} the response payload ready to be sent as the http response.
	 */
	requestTree: (services, state, key) => {
		if (!StatePathPacketTypes.includes(state))
			throw errors.createInvalidArgumentError('invalid `state` provided');

		const buildResponse = packet => 
			{ 
				const raw = convert.uint8ToHex(packet.payload);
				return { raw, tree: new MerkleTree().parseMerkleTreeFromRaw(packet.payload)}
			};
		const { connections } = services;
		const { timeout } = services.config.apiNode;
		const headerBuffer = packetHeader.createBuffer(
			state,
			packetHeader.size + key.length
		);
		const heightBuffer = Buffer.from(key);
		const packetBuffer = Buffer.concat([headerBuffer, heightBuffer]);
		return connections
			.singleUse()
			.then(connection => connection.pushPull(packetBuffer, timeout))
			.then(packet => buildResponse(packet));
	},
};

module.exports = merkleUtils;
