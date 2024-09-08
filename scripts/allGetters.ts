import { Address, toNano } from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { ActualAddress } from '../actualContract';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(ActualAddress);

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(address));

    console.log("MERKLE ROOT: " + await jettonDropper.get_merkle_root());
    console.log("MERKLE DEPTH: " + await jettonDropper.get_merkle_depth());
    console.log("Counter: " + await jettonDropper.getCounter());

}