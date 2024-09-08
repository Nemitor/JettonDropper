import {beginCell, BitString, Cell} from '@ton/core';
import '@ton/test-utils';
import {compareSliceForTest} from "@ton/test-utils/dist/test/comparisons";

export function CreateDataCell(cells_count: number): Cell {
    let DATA_CELL: Cell;

    let depth = calculateDepth(cells_count) - 1;
    let top_level = cellsPerDepth(depth);
    let cell_per_level = cells_count-top_level;
    let cells_per_level : number[] = [];
    cells_per_level.push(cell_per_level);
    while ( depth > 0 ){
        depth = depth - 1;
        let x = cellsPerDepth(depth);
        let cell_per_level = top_level - x;
        if (cell_per_level == 0 ) cell_per_level = 1;
        cells_per_level.push(cell_per_level);
        top_level = x;
    }

    let Cells_level_0: Cell[] = [];
    for (let i = 0 ; i< cells_per_level[0]; i++){
        Cells_level_0.push(beginCell().storeUint(0,1023).endCell());
    }

    let Cells_level_1: Cell[] = [];
    for (let i: number = 0; i < cells_per_level[1]; i++) {
        let j = 0;
        let builder = beginCell().storeUint(0,1023);
        while (j < 4 && Cells_level_0.length > 0) {
            let cell = Cells_level_0.pop();
            if (cell){
                builder.storeRef(cell);
            }
            j++;
        }
        Cells_level_1.push(builder.endCell());
    }
    let Cells_level_2: Cell[] = [];
    for (let i: number = 0; i < cells_per_level[2]; i++) {
        let j = 0;
        let builder = beginCell().storeUint(0,1023);
        while (j < 4 && Cells_level_1.length > 0) {
            let cell = Cells_level_1.pop();
            if (cell) builder.storeRef(cell);
            j++;
        }
        Cells_level_2.push(builder.endCell());
    }



    let Cells_level_3: Cell[] = [];
    for (let i: number = 0; i < cells_per_level[3]; i++) {
        let j = 0;
        let builder = beginCell().storeUint(0,1023);
        while (j < 4 && Cells_level_2.length > 0) {
            let cell = Cells_level_2.pop();
            if (cell) builder.storeRef(cell);
            j++;
        }
        Cells_level_3.push(builder.endCell());
    }


    let j = 0;
    let builder = beginCell().storeUint(0,1023);
    while (j < 4 && Cells_level_3.length > 0) {
        let cell = Cells_level_3.pop();
        if (cell) builder.storeRef(cell);
        j++;
    }
    DATA_CELL = builder.endCell();
    return DATA_CELL;
}


function calculateDepth(cell: number): number {
    if (cell <= 0) {
        return 0;
    }
    let maxPerDepth = 0;
    let i = 0;
    while (maxPerDepth < cell) {
        i++;
        maxPerDepth += 4 ** i;
    }
    return i;
}

function cellsPerDepth(depth: number): number {
    if (depth == 0) {
        return 1;
    }
    let maxPerDepth = 0;
    let i = 0;
    while (i < depth) {
        i++;
        maxPerDepth += 4 ** i;
    }
    return maxPerDepth + 1;
}
