import {Address, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { compile, NetworkProvider } from '@ton/blueprint';
import {bufferToInt, MerkleTree} from "../merkle/merkle";
import {beginCell} from "ton-core";

const keys: bigint[] = [];
for (let i = 0n; i < 2n ** 17n; i++) {
    keys.push(i);
}

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

const leaves = Array.from({ length: 131072 }, (_, i) => BigInt(i + 1));
const merkle = MerkleTree.fromLeaves(leaves, merkleHash);

export async function run(provider: NetworkProvider) {
    const jettonDropper = provider.open(
        JettonDropper.createFromConfig(
            {
                merkle_root: merkle.root(),
                merkle_depth: merkle.depth,
                owner: Address.parse("0QDU-Ityi50zT5jKDyZXtQ0eLfKV_30gqA0MPFFOQHh2WwzS"),
                data_tree_contract_addr: Address.parse("EQAQqM0RS2QyDnfChiBK_imgc_X0gWDYaw1I4VfT2dkZcPZg"),
                id: Math.floor(Math.random() * 10000),
            },
            await compile('JettonDropper')
        )
    );

    await jettonDropper.sendDeploy(provider.sender(), toNano('0.002'));

    await provider.waitForDeploy(jettonDropper.address , 20);

    console.log('ID', await jettonDropper.getID());
}
