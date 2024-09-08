import { toNano } from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonDropper = provider.open(
        JettonDropper.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('JettonDropper')
        )
    );

    await jettonDropper.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonDropper.address);

    console.log('ID', await jettonDropper.getID());
}
