import { Address, toNano } from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { ActualAddress } from '../actualContract';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(ActualAddress);

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(address));

    await jettonDropper.sendSetRoot( provider.sender(), {
        merkle_root: 999,
        merkle_depth: 1,
        value: toNano('0.05'),
    });



    ui.clearActionPrompt();
    ui.write('Counter increased successfully!');
}
