import {Address, toNano} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import { compile, NetworkProvider } from '@ton/blueprint';
import {CreateDataCell} from "../dataStorage/CellCreator";

export async function run(provider: NetworkProvider){
    const dataStorage = provider.open(DataStorage.createFromConfig({
        master: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
        wallet_address:  Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
        owner:  Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
        data_tree_root: CreateDataCell(98)
    }, await compile('DataStorage')));

    await dataStorage.sendDeploy(provider.sender(), toNano('0.02'));

    await  provider.waitForDeploy(dataStorage.address,20);


}
