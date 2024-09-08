import {Address, toNano} from '@ton/core';
import {DataStorage} from '../wrappers/DataStorage';
import {compile, NetworkProvider} from '@ton/blueprint';
import {JettonDropperAddr, DataStorageAddr} from "../actualContract";

export async function run(provider: NetworkProvider, args: string[]){
    const ui = provider.ui();

    const address = Address.parse(DataStorageAddr);


    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const dataStorage = provider.open(DataStorage.createFromAddress(address))

    await dataStorage.sendUpdateMaster( provider.sender(), {
        master: Address.parse(JettonDropperAddr),
        value: toNano('0.002'),
    });
}
