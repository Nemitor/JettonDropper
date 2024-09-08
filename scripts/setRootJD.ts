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

    const merkle = MerkleTree.fromLeaves([1111n,2222n,3333n,4444n], merkleHash);

    await jettonDropper.sendSetRoot( provider.sender(), {
        merkle_root: merkle.root(),
        merkle_depth: merkle.depth,
        value: toNano('0.05'),
    });



    ui.clearActionPrompt();
    ui.write('Counter increased successfully!');
}
