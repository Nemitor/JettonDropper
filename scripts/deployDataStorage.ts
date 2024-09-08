import {Address, toNano} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import { compile, NetworkProvider } from '@ton/blueprint';
import {CreateDataCell} from "../dataStorage/CellCreator";

export async function run(provider: NetworkProvider){
    const dataStorage = provider.open(DataStorage.createFromConfig({
        master: Address.parse("EQDVurzh1dDvoxb3SFLJszks5v64J8SQHd1PWdaF8E0gz4OX"),
        jetton_wallet_addres:  Address.parse("kQAulNXYX21m34m_2tNryHLrVK5lru5qdRBo405xaC0srXcC"),
        owner:  Address.parse("0QDU-Ityi50zT5jKDyZXtQ0eLfKV_30gqA0MPFFOQHh2WwzS"),
        data_tree_root: CreateDataCell(98),
        ctx_id: Math.floor(Math.random() * 10000),
    }, await compile('DataStorage')));

    await dataStorage.sendDeploy(provider.sender(), toNano('0.02'));

    await  provider.waitForDeploy(dataStorage.address,20);


}
