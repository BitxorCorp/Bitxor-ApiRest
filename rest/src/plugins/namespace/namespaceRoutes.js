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

const namespaceUtils = require('./namespaceUtils');
const dbUtils = require('../../db/dbUtils');
const merkleUtils = require('../../routes/merkleUtils');
const routeUtils = require('../../routes/routeUtils');
const bitxorcore = require('bitxorcore-sdk');
const MongoDb = require('mongodb');

const { PacketType } = bitxorcore.packet;
const { Binary } = MongoDb;
const { convertToLong } = dbUtils;
const { uint64 } = bitxorcore.utils;

module.exports = {
	register: (server, db, services) => {
		const namespaceSender = routeUtils.createSender('namespaceDescriptor');

		server.get('/namespaces', (req, res, next) => {
			const { params } = req;

			const ownerAddress = params.ownerAddress ? routeUtils.parseArgument(params, 'ownerAddress', 'address') : undefined;
			const registrationType = params.registrationType ? routeUtils.parseArgument(params, 'registrationType', 'uint') : undefined;
			const level0 = params.level0 ? routeUtils.parseArgument(req.params, 'level0', uint64.fromHex) : undefined;
			const aliasType = params.aliasType ? routeUtils.parseArgument(params, 'aliasType', 'uint') : undefined;

			const options = routeUtils.parsePaginationArguments(req.params, services.config.pageSize, { id: 'objectId' });

			return db.namespaces(aliasType, level0, ownerAddress, registrationType, options)
				.then(result => namespaceSender.sendPage(res, next)(result));
		});

		server.get('/namespaces/:namespaceId', (req, res, next) => {
			const namespaceId = routeUtils.parseArgument(req.params, 'namespaceId', uint64.fromHex);
			return db.namespaceById(namespaceId)
				.then(namespaceSender.sendOne(req.params.namespaceId, res, next));
		});

		const collectNames = (namespaceNameTuples, namespaceIds) => {
			const type = bitxorcore.model.EntityType.registerNamespace;
			return db.bitxorcoreDb.findNamesByIds(namespaceIds, type, { id: 'id', name: 'name', parentId: 'parentId' })
				.then(nameTuples => {
					nameTuples.forEach(nameTuple => {
						// db returns null instead of undefined when parentId is not present
						if (null === nameTuple.parentId)
							delete nameTuple.parentId;

						namespaceNameTuples.push(nameTuple);
					});

					// process all parent namespaces next
					return nameTuples
						.filter(nameTuple => undefined !== nameTuple.parentId)
						.map(nameTuple => nameTuple.parentId);
				});
		};

		server.post('/namespaces/names', (req, res, next) => {
			const namespaceIds = routeUtils.parseArgumentAsArray(req.params, 'namespaceIds', uint64.fromHex);
			const nameTuplesFuture = new Promise(resolve => {
				const namespaceNameTuples = [];
				const chain = nextIds => {
					if (0 === nextIds.length)
						resolve(namespaceNameTuples);
					else
						collectNames(namespaceNameTuples, nextIds).then(chain);
				};

				collectNames(namespaceNameTuples, namespaceIds).then(chain);
			});

			return nameTuplesFuture.then(routeUtils.createSender('namespaceNameTuple').sendArray('namespaceIds', res, next));
		});

		server.post('/namespaces/token/names', namespaceUtils.aliasNamesRoutesProcessor(
			db,
			bitxorcore.model.namespace.aliasType.token,
			req => routeUtils.parseArgumentAsArray(req.params, 'tokenIds', uint64.fromHex).map(convertToLong),
			(namespace, id) => namespace.namespace.alias.tokenId.equals(id),
			'tokenId',
			'tokenNames'
		));

		server.post('/namespaces/account/names', namespaceUtils.aliasNamesRoutesProcessor(
			db,
			bitxorcore.model.namespace.aliasType.address,
			req => routeUtils.parseArgumentAsArray(req.params, 'addresses', 'address'),
			(namespace, id) => Buffer.from(namespace.namespace.alias.address.value())
				.equals(Buffer.from(new Binary(Buffer.from(id)).value())),
			'address',
			'accountNames'
		));

		// this endpoint is here because it is expected to support requests by block other than <current block>
		server.get('/namespaces/:namespaceId/merkle', (req, res, next) => {
			const namespaceId = routeUtils.parseArgument(req.params, 'namespaceId', 'uint64hex');
			const state = PacketType.namespaceStatePath;
			return merkleUtils.requestTree(services, state,
				uint64.toBytes(namespaceId)).then(response => {
				res.send(response);
				next();
			});
		});
	}
};
