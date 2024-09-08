import {Address, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { compile, NetworkProvider } from '@ton/blueprint';
import fetch from 'node-fetch';
import {DataStorageAddr} from "../actualContract";
// import {bufferToInt, MerkleTree} from "../merkle/merkle";
// import {beginCell} from "ton-core";
//
// const keys: bigint[] = [];
// for (let i = 0n; i < 2n ** 17n; i++) {
//     keys.push(i);
// }
//
// const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());
//
// const leaves = Array.from({ length: 131072 }, (_, i) => BigInt(i + 1));
// const merkle = MerkleTree.fromLeaves(leaves, merkleHash);

const stringToBigInt = (str: string): bigint => BigInt(str);



export async function run(provider: NetworkProvider) {
    const senderAddress = provider.sender()?.address;
    if (!senderAddress) {
        throw new Error('Sender address is undefined');
    }
    // Получаем данные с сервера
    const response = await fetch('http://localhost:3010/api/merkle/root');
    if (!response.ok) {
        throw new Error('Failed to fetch merkle data');
    }

    const data = await response.json();
    const merkleRoot = stringToBigInt(data.root);
    const merkleDepth = data.depth;

    const jettonDropper = provider.open(
        JettonDropper.createFromConfig(
            {
                merkle_root: merkleRoot,
                merkle_depth: merkleDepth,
                owner: senderAddress,
                data_tree_contract_addr: Address.parse(DataStorageAddr),
                id: Math.floor(Math.random() * 10000),
            },
            await compile('JettonDropper')
        )
    );

    await jettonDropper.sendDeploy(provider.sender(), toNano('0.002'));

    await provider.waitForDeploy(jettonDropper.address , 60);

    console.log('ID', await jettonDropper.getID());
}
