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

    console.log("MERKLE ROOT: " + await jettonDropper.getMerkleRoot());
    console.log("MERKLE DEPTH: " + await jettonDropper.getMerkleDepth());
    console.log("ID: " + await jettonDropper.getID());
    console.log("SENQ: " + await jettonDropper.getSenq());
    console.log("JET WALLET ADR: " + await jettonDropper.get_jetton_wallet_adr());
}