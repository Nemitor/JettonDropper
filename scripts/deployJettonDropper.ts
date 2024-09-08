import {Address, toNano} from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonDropper = provider.open(
        JettonDropper.createFromConfig(
            {
                merkle_root: 3,
                merkle_depth: 1,
                owner: Address.parse("0QDU-Ityi50zT5jKDyZXtQ0eLfKV_30gqA0MPFFOQHh2WwzS"),
                id: Math.floor(Math.random() * 10000),
                counter: 0,
                node_dict_key_len: 0,
                senq: 0
            },
            await compile('JettonDropper')
        )
    );

    await jettonDropper.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonDropper.address , 20);

    console.log('ID', await jettonDropper.getID());
}
