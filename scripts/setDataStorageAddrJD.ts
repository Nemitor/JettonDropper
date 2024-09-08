import {Address, beginCell, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { NetworkProvider, sleep } from '@ton/blueprint';
import {ActualAddress, DataStorageAddr} from '../actualContract';


export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(ActualAddress);

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(address));

    await jettonDropper.sendUpdateDS( provider.sender(), {
        DS: Address.parse(DataStorageAddr),
        value: toNano('0.02'),
    });



    ui.clearActionPrompt();
}
