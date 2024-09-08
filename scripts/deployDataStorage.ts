import {Address, beginCell, Dictionary, toNano} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import { compile, NetworkProvider } from '@ton/blueprint';
import {JettonDropperAddr} from "../actualContract";

export async function run(provider: NetworkProvider){

    const senderAddress = provider.sender()?.address;
    if (!senderAddress) {
        throw new Error('Sender address is undefined');
    }
    // Получаем данные с сервера

    const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());

    //Заполнение DICT
    for (let i = 0; i < 98; i++) {
        const cell = beginCell().storeUint(0,1023).endCell();
        dict.set(i, cell);
    }
    const dataStorage = provider.open(DataStorage.createFromConfig({
        master: Address.parse(JettonDropperAddr),
        jetton_wallet_address:  Address.parse("kQAulNXYX21m34m_2tNryHLrVK5lru5qdRBo405xaC0srXcC"),
        owner:  senderAddress,
        data_tree_root: dict,
        ctx_id: Math.floor(Math.random() * 10000),
    }, await compile('DataStorage')));

    await dataStorage.sendDeploy(provider.sender(), toNano('0.002'));

    await  provider.waitForDeploy(dataStorage.address,20);

    console.log(await dataStorage.getID());

}
