import { toNano } from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const dataStorage = provider.open(DataStorage.createFromConfig({}, await compile('DataStorage')));

    await dataStorage.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(dataStorage.address);

    // run methods on `dataStorage`
}
