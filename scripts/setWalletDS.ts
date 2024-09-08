import {Address, toNano} from '@ton/core';
import {DataStorage} from '../wrappers/DataStorage';
import {NetworkProvider} from '@ton/blueprint';
import {DataStorageAddr, TokenWalletAddr} from "../actualContract";

export async function run(provider: NetworkProvider, args: string[]){
    const ui = provider.ui();

    const address = Address.parse(DataStorageAddr);


    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const dataStorage = provider.open(DataStorage.createFromAddress(address))

    await dataStorage.sendSetWallet( provider.sender(), {
        wallet: Address.parse(TokenWalletAddr),
        value: toNano('0.002'),
    });
}
