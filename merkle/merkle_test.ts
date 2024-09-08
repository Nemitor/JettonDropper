import { Cell, beginCell, toNano } from 'ton-core';
import { MerkleTree, bufferToInt } from './merkle';

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

const keys: bigint[] = [];
for (let i = 0n; i < 2n ** 17n; i++) {
    keys.push(i);
}
const merkle = MerkleTree.fromLeaves(keys, merkleHash);

console.log(merkle.root());
console.log(merkle.depth);
console.log(merkle.proofForNode(merkle.leafIdxToNodeIdx(0)));
console.log(merkle.leaf(0));
