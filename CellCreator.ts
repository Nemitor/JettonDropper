import {Address, beginCell, Cell, BitString, toNano} from '@ton/core';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

const maxDataInCell: bigint = 1023n;


function CreateCellWithZeros(){
    let buffer = Buffer.alloc(128);
    buffer[0] = 0b00000000;
    let bitString = new BitString(buffer, 0, 1023);
    let zerosCell = beginCell().storeBits(bitString).endCell();
}

export function CreateDataCell(bit_len: bigint ): Cell {
    let max_cells: number = Math.ceil(Number(bit_len / maxDataInCell));



}
