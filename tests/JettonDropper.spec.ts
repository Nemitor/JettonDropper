import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, Cell, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import {bufferToInt, MerkleTree} from "../merkle/merkle";
import {beginCell} from "ton-core";

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

const keys: bigint[] = [];
for (let i = 0n; i < 2n ** 17n; i++) {
    keys.push(i);
}

const merkle = MerkleTree.fromLeaves(keys, merkleHash);

describe('JettonDropper', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonDropper');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonDropper: SandboxContract<JettonDropper>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jettonDropper = blockchain.openContract(
            JettonDropper.createFromConfig(
                {
                    merkle_root: merkle.root(),
                    merkle_depth: merkle.depth,
                    owner: Address.parse("0QDU-Ityi50zT5jKDyZXtQ0eLfKV_30gqA0MPFFOQHh2WwzS"),
                    jetton_wallet_adr: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
                    id: Math.floor(Math.random() * 10000),
                    senq: 0
                },
                await compile('JettonDropper')
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jettonDropper.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonDropper.address,
            deploy: true,
            success: true,
        });
    });

    it('should claim', async () =>{

        const senq =  await jettonDropper.getSenq();
        console.log("senq before: " + senq);

        await blockchain.setVerbosityForAddress(jettonDropper.address,{
            vmLogs: 'none',
            print: false,
            blockchainLogs: false,
            debugLogs: false
        })

        const claimer = await blockchain.treasury('claimer');

        const firstClaim = await jettonDropper.sendClaim(claimer.getSender(), {
            value: toNano('0.05'),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(0)),
            leaf: merkle.leaf(0),
            leaf_index: 0,
        })

        expect(firstClaim.transactions).toHaveTransaction({
            from: claimer.address,
            to: jettonDropper.address,
            success: true,
        })

        expect(await jettonDropper.getSenq()).toBe(senq+1);
    })

    it('cant claim twice', async () =>{
        const senq =  await jettonDropper.getSenq();
        console.log(senq);

        const claimer = await blockchain.treasury('claimer');

        const firstClaim = await jettonDropper.sendClaim(claimer.getSender(), {
            value: toNano('0.05'),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(0)),
            leaf: merkle.leaf(0),
            leaf_index: 0,
        })

        expect(await jettonDropper.getSenq()).toBe(senq + 1);

        const secondClaim = await jettonDropper.sendClaim(claimer.getSender(), {
            value: toNano('0.05'),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(0)),
            leaf: merkle.leaf(0),
            leaf_index: 0,
        })

        expect(secondClaim.transactions).toHaveTransaction({
            from: claimer.address,
            to: jettonDropper.address,
            exitCode: 888,
        })

        expect(await jettonDropper.getSenq()).toBe(senq + 1);

        const trirdClaim = await jettonDropper.sendClaim(claimer.getSender(), {
            value: toNano('0.05'),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(1)),
            leaf: merkle.leaf(1),
            leaf_index: 1,
        })

        expect(trirdClaim.transactions).toHaveTransaction({
            from: claimer.address,
            to: jettonDropper.address,
            success: true
        })
        expect(await jettonDropper.getSenq()).toBe(2);
    })

    // it('can work with all keys', async () =>{
    //     const claimer = await blockchain.treasury('claimer');
    //     for (let i = 0n; i < 2n ** 17n; i++) {
    //         console.log(i);
    //         const claim = await jettonDropper.sendClaim(claimer.getSender(), {
    //             value: toNano('0.05'),
    //             proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(Number(i))),
    //             leaf: merkle.leaf(Number(i)),
    //             leaf_index: Number(i),
    //         })
    //     }
    //     expect(await jettonDropper.getSenq()).toBeGreaterThan(131060);
    // })
});
