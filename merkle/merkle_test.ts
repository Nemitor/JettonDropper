import { Cell, beginCell, toNano } from 'ton-core';
import { MerkleTree, bufferToInt } from './merkle';

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());

const merkle = MerkleTree.fromLeaves([1111n, 2222n, 3333n, 444n, 555n, 666n, 777n, 888n], merkleHash);

console.log(merkle.root());
console.log(merkle.depth);
console.log(merkle.proofForNode(merkle.leafIdxToNodeIdx(1)));
