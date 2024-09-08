import {Address, beginCell, Dictionary, toNano} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider){
    const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());

    //Заполнение DICT
    for (let i = 0; i < 98; i++) {
        const cell = beginCell().storeUint(0,1023).endCell();
        dict.set(i, cell);
    }
    const dataStorage = provider.open(DataStorage.createFromConfig({
        master: Address.parse("EQDVurzh1dDvoxb3SFLJszks5v64J8SQHd1PWdaF8E0gz4OX"),
        jetton_wallet_address:  Address.parse("kQAulNXYX21m34m_2tNryHLrVK5lru5qdRBo405xaC0srXcC"),
        owner:  Address.parse("0QDU-Ityi50zT5jKDyZXtQ0eLfKV_30gqA0MPFFOQHh2WwzS"),
        data_tree_root: dict,
        ctx_id: Math.floor(Math.random() * 10000),
    }, await compile('DataStorage')));

    await dataStorage.sendDeploy(provider.sender(), toNano('0.02'));

    await  provider.waitForDeploy(dataStorage.address,20);

    console.log(await dataStorage.getID());

}
