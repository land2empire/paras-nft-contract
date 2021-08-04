const assert = require('assert');
const { parseNearAmount } = require('near-api-js/lib/utils/format');
const testUtils = require('./test-utils');

const {
	gas,
	contractId,
	contractAccount,
	getAccount,
} = testUtils;

describe('NFT Series', function () {
	this.timeout(10000);

	const now = Date.now().toString()
	let token_type_title = 'dog-' + now

	/// users
	const aliceId = 'alice-' + now + '.' + contractId;
	let alice
	it('should create user accounts', async function () {
		alice = await getAccount(aliceId);
		console.log('\n\n alice accountId:', aliceId, '\n\n');
	})

	it('should be deployed', async function () {
		const state = await contractAccount.state()
		try {
			await contractAccount.functionCall({
				contractId,
				methodName: 'new_default_meta',
				args: {
					owner_id: contractId
				},
				gas
			})
		} catch (e) {
			if (!/contract has already been initialized/.test(e.toString())) {
				console.warn(e)
			}
		}

		assert.notStrictEqual(state.code_hash, '11111111111111111111111111111111');
	});

	it('should allow someone to create a type', async function () {
		await contractAccount.functionCall({
			contractId,
			methodName: 'nft_create_type',
			args: {
				token_metadata: {
					title: token_type_title,
					media: 'https://placedog.net/500',
					copies: 1,
				}
			},
			gas,
			attachedDeposit: parseNearAmount('0.1')
		})

		const [token_type_id, owner_id, type_metadata] = await contractAccount.viewFunction(
			contractId,
			'nft_get_type',
			{
				token_type_title
			}
		)

		assert.strictEqual(token_type_id, 1);
		assert.strictEqual(owner_id, contractId);
		assert.strictEqual(type_metadata.copies, 1);
	});

	it('should NOT allow a NON owner to mint copies', async function () {
		try {
			await alice.functionCall({
				contractId,
				methodName: 'nft_mint_type',
				args: {
					token_type_title,
					receiver_id: contractId
				},
				gas,
				attachedDeposit: parseNearAmount('0.1')
			})
			assert(false)
		} catch(e) {
			assert(true)
		}
	});

	it('should allow the owner to mint a token of a particular type', async function () {

		// const stateBefore = await (await getAccount(contractId)).state();
		// console.log('stateBefore', stateBefore)

		await contractAccount.functionCall({
			contractId,
			methodName: 'nft_mint_type',
			args: {
				token_type_title,
				receiver_id: contractId
			},
			gas,
			attachedDeposit: parseNearAmount('0.1')
		})

		// const stateAfter = await (await getAccount(contractId)).state();
		// console.log('stateAfter', stateAfter)

		const supply_for_type = await contractAccount.viewFunction(
			contractId,
			'nft_supply_for_type',
			{
				token_type_title
			}
		)
		assert.strictEqual(parseInt(supply_for_type, 10), 1);

		const tokens = await contractAccount.viewFunction(
			contractId,
			'nft_tokens_by_type',
			{
				token_type_title
			}
		)
		
		console.log(tokens[0].metadata.title)

		assert.strictEqual(tokens[0].token_id, '1:1');
		assert.strictEqual(tokens[0].owner_id, contractId);
	});

	it('should NOT allow the owner to mint more than copies', async function () {
		try {
			await contractAccount.functionCall({
				contractId,
				methodName: 'nft_mint_type',
				args: {
					token_type_title,
					receiver_id: contractId
				},
				gas,
				attachedDeposit: parseNearAmount('0.1')
			})
			assert(false)
		} catch(e) {
			assert(true)
		}
	});
})
