import {Address, beginCell, toNano} from '@ton/core';
import {JettonDropper} from '../wrappers/JettonDropper';
import {NetworkProvider } from '@ton/blueprint';
import {JettonDropperAddr} from '../actualContract';
import fetch from "node-fetch";

const stringToBigInt = (str: string): bigint => BigInt(str);

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    // Получаем данные с сервера
    const response = await fetch('http://localhost:3010/api/merkle/root');
    if (!response.ok) {
        throw new Error('Failed to fetch merkle data');
    }

    const data = await response.json();
    const merkleRoot = stringToBigInt(data.root); // Преобразуем ROOT в bigint
    const merkleDepth = data.depth; // Получаем DEPTH

    const address = Address.parse(JettonDropperAddr);

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(address));

    await jettonDropper.sendSetRoot( provider.sender(), {
        merkle_root: merkleRoot,
        merkle_depth: merkleDepth,
        value: toNano('0.002'),
    });



    ui.clearActionPrompt();
    ui.write('Counter increased successfully!');
}
