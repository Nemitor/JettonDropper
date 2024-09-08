import { Cell, beginCell, toNano } from 'ton-core';
import { MerkleTree, bufferToInt } from './merkle';

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

const merkle = MerkleTree.fromLeaves([1111n,2222n,3333n,4444n], merkleHash);

console.log(merkle.root());
console.log(merkle.depth);
console.log(merkle.proofForNode(merkle.leafIdxToNodeIdx(1)));
console.log(merkle.leaf(1));
