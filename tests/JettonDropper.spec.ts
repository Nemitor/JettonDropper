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

const incorrectKeys: bigint[] = [];
for (let i = 0n; i < 2n ** 16n; i++) {
    incorrectKeys.push(i);
}

const incorrectMerkle = MerkleTree.fromLeaves(incorrectKeys, merkleHash);

describe('JettonDropper', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonDropper');
    });

    let blockchain: Blockchain;
    let admin: SandboxContract<TreasuryContract>;
    let jettonDropper: SandboxContract<JettonDropper>;
    let isolateDataStorage: SandboxContract<TreasuryContract>;
    let attacker: SandboxContract<TreasuryContract>;
    let claimer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        claimer = await blockchain.treasury('claimer');
        admin = await blockchain.treasury('admin');
        isolateDataStorage = await blockchain.treasury('isolateDataStorage');
        attacker = await blockchain.treasury('attacker');

        jettonDropper = blockchain.openContract(
            JettonDropper.createFromConfig(
                {
                    merkle_root: merkle.root(),
                    merkle_depth: merkle.depth,
                    owner: admin.address,
                    data_tree_contract_addr: isolateDataStorage.address,
                    id: Math.floor(Math.random() * 10000),
                },
                await compile('JettonDropper')
            )
        );

        const deployResult = await jettonDropper.sendDeploy(admin.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: jettonDropper.address,
            deploy: true,
            success: true,
        });
    });

    it('should claim and be protected', async () => {
        let claimIndex = 0;

        let claimData = await jettonDropper.sendClaim(claimer.getSender(),{
            value: toNano("0.03"),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(claimIndex)),
            leaf: merkle.leaf(claimIndex),
            leaf_index: claimIndex,
        })

        expect(claimData.transactions).toHaveTransaction({
            from: claimer.address,
            to: jettonDropper.address,
            success: true,
        });

        let claimAttackData = await jettonDropper.sendClaim(attacker.getSender(),{
            value: toNano("0.03"),
            proof: incorrectMerkle.proofForNode(incorrectMerkle.leafIdxToNodeIdx(claimIndex)),
            leaf: incorrectMerkle.leaf(claimIndex),
            leaf_index: claimIndex,
        })

        expect(claimAttackData.transactions).toHaveTransaction({
            from: attacker.address,
            to: jettonDropper.address,
            success: false,
        });
    });

    it('should claim and be protected', async () => {
        await jettonDropper.sendSetRoot(admin.getSender(),{
            value: toNano('0.05'),
            merkle_root: incorrectMerkle.root(),
            merkle_depth: incorrectMerkle.depth,
        })

        let rootBefore = await jettonDropper.getMerkleRoot();

        expect(rootBefore.toString()).toEqual(incorrectMerkle.root().toString())

        let attackData = await jettonDropper.sendSetRoot(attacker.getSender(),{
            value: toNano('0.05'),
            merkle_root: incorrectMerkle.root(),
            merkle_depth: incorrectMerkle.depth,
        })

        expect(attackData.transactions).toHaveTransaction({
            from: attacker.address,
            to: jettonDropper.address,
            success: false
        })
    });

    it('should setDataTree and be protected', async () => {
        await jettonDropper.sendUpdateDS(admin.getSender(),{
            value: toNano("0.05"),
            DS: admin.address,
        })

        let dataTreeAfter = await jettonDropper.getDataTreeContractAddr();

        expect(dataTreeAfter.toString()).toEqual(admin.address.toString())

        let attackData = await jettonDropper.sendUpdateDS(attacker.getSender(),{
            value: toNano("0.05"),
            DS: attacker.address,
        })

        expect(attackData.transactions).toHaveTransaction({
            from: attacker.address,
            to: jettonDropper.address,
            success: false,
        })
    });
});
