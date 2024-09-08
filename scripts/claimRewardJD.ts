import {Address, beginCell, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { ActualAddress } from '../actualContract';
import {bufferToInt, MerkleTree} from "../merkle/merkle";

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(ActualAddress);

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(address));

    const leaves = Array.from({ length: 131072 }, (_, i) => BigInt(i + 1));
    const merkle = MerkleTree.fromLeaves(leaves, merkleHash);


    let index = 1;
    await jettonDropper.sendClaim( provider.sender(), {
        value: toNano('0.1'),
        proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(index)),
        leaf: merkle.leaf(index),
        leaf_index: index,
    })



    ui.clearActionPrompt();
}
