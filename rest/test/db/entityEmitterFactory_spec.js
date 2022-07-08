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

const entityEmitterFactory = require('../../src/db/entityEmitterFactory');
const { expect } = require('chai');
const EventEmitter = require('events');

describe('entity emitter factory', () => {
	it('registers block listener', () => {
		// Act:
		const queries = [];
		const entityEmitterPromise = entityEmitterFactory.createEntityEmitter(query => {
			queries.push(query);
			return Promise.resolve(new EventEmitter());
		});
		entityEmitterPromise.then(() => {
			// Assert:
			expect(queries.length).to.equal(1);
			expect(queries[0]).to.deep.equal({ ns: 'bitxorcore.blocks', op: 'i' });
		});
	});

	const createEntityEmitter = opEmitters => entityEmitterFactory.createEntityEmitter(query => {
		const opEmitter = new EventEmitter();
		opEmitters[query.ns] = opEmitter;
		return Promise.resolve(opEmitter);
	});

	const assertNoEvents = (emitter, eventName) => {
		emitter.once(eventName, () => {
			// Assert: fail the test if the event was raised
			expect(true, `${eventName} event was unexpected`).to.equal(false);
		});
	};

	it('maps op event to block event', () => {
		// Arrange:
		const opEmitters = {};
		return createEntityEmitter(opEmitters)
			.then(entityEmitter => {
				assertNoEvents(entityEmitter, 'error');

				return new Promise(resolve => {
					// - set up a block listener
					entityEmitter.once('block', block => {
						// Assert: the op event was translated to a block event
						expect(block).to.deep.equal({ height: 7 });
						resolve();
					});

					// Act: raise an op event
					opEmitters['bitxorcore.blocks'].emit('op', { ns: 'bitxorcore.blocks', op: 'i', o: { height: 7 } });
				});
			});
	});

	it('forwards op error event', () => {
		// Arrange:
		const opEmitters = {};
		return createEntityEmitter(opEmitters)
			.then(entityEmitter => {
				assertNoEvents(entityEmitter, 'block');

				return new Promise(resolve => {
					// - set up an error listener
					entityEmitter.once('error', err => {
						// Assert: the op error event was forwarded
						expect(err.message).to.equal('op error');
						resolve();
					});

					// Act: raise an op error event
					opEmitters['bitxorcore.blocks'].emit('error', new Error('op error'));
				});
			});
	});
});
