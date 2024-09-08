import {beginCell, BitString, Cell} from '@ton/core';
import '@ton/test-utils';
import {compareSliceForTest} from "@ton/test-utils/dist/test/comparisons";

function CreateCellWithZeros() : Cell{

    return beginCell().storeUint(0,1023).endCell();
}
export function CreateDataCell(cells_count: number): Cell {
    let depth = calculateDepth(cells_count) - 1;
    let top_level = cellsPerDepth(depth);
    let cell_per_level = cells_count - top_level;
    let cells_per_level: number[] = [cell_per_level];

    while (depth > 0) {
        depth--;
        let x = cellsPerDepth(depth);
        cell_per_level = top_level - x || 1;
        cells_per_level.push(cell_per_level);
        top_level = x;
    }

    let Cells = Array(cells_per_level[0]).fill(null).map(() => CreateCellWithZeros());

    function createLevel(cells: Cell[], count: number): Cell[] {
        return Array(count).fill(null).map(() => {
            let builder = beginCell().storeUint(0,1023);
            for (let j = 0; j < 4 && cells.length > 0; j++) {
                let cell = cells.pop();
                if (cell) builder.storeRef(cell);
            }
            return builder.endCell();
        });
    }

    let currentLevel = Cells;
    for (let i = 1; i < cells_per_level.length; i++) {
        currentLevel = createLevel(currentLevel, cells_per_level[i]);
    }

    let builder = beginCell().storeUint(0,1023);
    for (let j = 0; j < 4 && currentLevel.length > 0; j++) {
        let cell = currentLevel.pop();
        if (cell) builder.storeRef(cell);
    }

    return builder.endCell();
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
