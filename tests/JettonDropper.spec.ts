import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, Cell, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import {bufferToInt, MerkleTree} from "../merkle/merkle";
import {beginCell} from "ton-core";

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

const merkle = MerkleTree.fromLeaves([1112n,2222n,3333n,4444n], merkleHash);

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
                    id: Math.floor(Math.random() * 10000),
                    counter: 0,
                    node_dict_key_len: 32,
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

    // it('should deploy', async () => {
    //     // the check is done inside beforeEach
    //     // blockchain and jettonDropper are ready to use
    // });
    //
    // it('should increase counter', async () => {
    //     const increaseTimes = 3;
    //     for (let i = 0; i < increaseTimes; i++) {
    //         console.log(`increase ${i + 1}/${increaseTimes}`);
    //
    //         const increaser = await blockchain.treasury('increaser' + i);
    //
    //         const counterBefore = await jettonDropper.getCounter();
    //
    //         console.log('counter before increasing', counterBefore);
    //
    //         const increaseBy = Math.floor(Math.random() * 100);
    //
    //         console.log('increasing by', increaseBy);
    //
    //         const increaseResult = await jettonDropper.sendIncrease(increaser.getSender(), {
    //             increaseBy,
    //             value: toNano('0.05'),
    //         });
    //
    //         expect(increaseResult.transactions).toHaveTransaction({
    //             from: increaser.address,
    //             to: jettonDropper.address,
    //             success: true,
    //         });
    //
    //         const counterAfter = await jettonDropper.getCounter();
    //
    //         console.log('counter after increasing', counterAfter);
    //
    //         expect(counterAfter).toBe(counterBefore + increaseBy);
    //     }
    // });


    it('should claim', async () =>{

        await blockchain.setVerbosityForAddress(jettonDropper.address,{
            vmLogs: 'vm_logs_verbose',
            print: true,
            blockchainLogs: false,
            debugLogs: false
        })

        const claimer = await blockchain.treasury('claimer');
        await jettonDropper.sendClaim(claimer.getSender(), {
            value: toNano('0.05'),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(0)),
            leaf: merkle.leaf(0),
            leaf_index: 0,
        })
    })
});
