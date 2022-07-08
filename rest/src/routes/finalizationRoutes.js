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

const routeResultTypes = require('./routeResultTypes');
const routeUtils = require('./routeUtils');
const finalizationProofCodec = require('../sockets/finalizationProofCodec');
const bitxorcore = require('bitxorcore-sdk');
const { NotFoundError } = require('restify-errors');

const packetHeader = bitxorcore.packet.header;
const { PacketType } = bitxorcore.packet;
const { BinaryParser } = bitxorcore.parser;
const { uint64 } = bitxorcore.utils;

module.exports = {
	register: (server, db, services) => {
		const { connections } = services;
		const { timeout } = services.config.apiNode;

		const sendRequestAndResponse = (requestPacket, res, next) =>
			connections.singleUse()
				.then(connection => connection.pushPull(requestPacket, timeout))
				.then(packet => {
					const binaryParser = new BinaryParser();
					binaryParser.push(packet.payload);
					const payload = finalizationProofCodec.deserialize(binaryParser);
					if (!payload)
						return next(new NotFoundError());
					res.send({ payload, type: routeResultTypes.finalizationProof, formatter: 'ws' });
					return next();
				});

		server.get('/finalization/proof/epoch/:epoch', (req, res, next) => {
			const epoch = routeUtils.parseArgument(req.params, 'epoch', 'uint');

			const uint32Size = 4;
			const headerBuffer = packetHeader.createBuffer(PacketType.finalizationProofAtEpoch, packetHeader.size + uint32Size);
			const epochBuffer = Buffer.alloc(uint32Size);
			epochBuffer.writeUInt32LE(epoch);
			const packetBuffer = Buffer.concat([headerBuffer, epochBuffer]);

			return sendRequestAndResponse(packetBuffer, res, next);
		});

		server.get('/finalization/proof/height/:height', (req, res, next) => {
			const height = routeUtils.parseArgument(req.params, 'height', 'uint64');

			const uint64Size = 8;
			const headerBuffer = packetHeader.createBuffer(PacketType.finalizationProofAtHeight, packetHeader.size + uint64Size);
			const heightBuffer = Buffer.from(uint64.toBytes(height));
			const packetBuffer = Buffer.concat([headerBuffer, heightBuffer]);

			return sendRequestAndResponse(packetBuffer, res, next);
		});
	}
};
