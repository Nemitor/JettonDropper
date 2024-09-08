import {Address, beginCell, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JettonDropperAddr } from '../actualContract';
import {bufferToInt, hashToInt, MerkleTree} from "../merkle/merkle";
import fetch from "node-fetch";

const generateKeys = (seed: number, count: bigint): bigint[] => {
    const keys: bigint[] = [];
    const seedBuffer = Buffer.from(seed.toString());

    for (let i = 0n; i < count; i++) {
        const keyBuffer = Buffer.concat([seedBuffer, Buffer.from(i.toString())]);
        const hashedKey = hashToInt(keyBuffer);
        // Обрезаем до 32 бит
        const truncatedKey = hashedKey & 0xFFFFFFn;
        keys.push(truncatedKey);
    }

    return keys;
};

// Укажите константу и количество ключей
const seed = 99999;
const keyCount = 2n ** 17n;
const keys = generateKeys(seed, keyCount);

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());
const merkle = MerkleTree.fromLeaves(keys, merkleHash);

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(JettonDropperAddr);

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(address));
    let index = 7;
    const response = await fetch(`http://localhost:3010/api/merkle/proof/${index}`);
    if (!response.ok) {
        throw new Error('Failed to fetch merkle data');
    }

    const data = await response.json();
    const { proof, leaf } = data;
    const proofBigInts: bigint[] = proof.map((proofStr: string) => BigInt(proofStr));


    await jettonDropper.sendClaim( provider.sender(), {
        value: toNano('0.065'),
        proof: proofBigInts,
        leaf: leaf,
        leaf_index: index,
    })



    ui.clearActionPrompt();
}
