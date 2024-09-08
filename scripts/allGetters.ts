import { Address } from '@ton/core';
import { JettonDropper } from '../wrappers/JettonDropper';
import { NetworkProvider, sleep } from '@ton/blueprint';
import {ActualAddress, DataStorageAddr} from '../actualContract';
import { DataStorage } from '../wrappers/DataStorage';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const jdAddress = Address.parse(ActualAddress);
    const dsAddress = Address.parse(DataStorageAddr)

    if (!(await provider.isContractDeployed(jdAddress))) {
        ui.write(`Error: Contract at address ${jdAddress} is not deployed!`);
        return;
    }
    if (!(await provider.isContractDeployed(dsAddress))) {
        ui.write(`Error: Contract at address ${dsAddress} is not deployed!`);
        return;
    }

    const jettonDropper = provider.open(JettonDropper.createFromAddress(jdAddress));
    const dataStorage = provider.open(DataStorage.createFromAddress(dsAddress));

    console.log("===JETTON DROPPER===")
    console.log(jdAddress)
    console.log("MERKLE ROOT: " + await jettonDropper.getMerkleRoot());
    console.log("MERKLE DEPTH: " + await jettonDropper.getMerkleDepth());
    console.log("ID: " + await jettonDropper.getID());
    console.log("DS WALLET ADR: " + await jettonDropper.getDataTreeContractAddr());
    console.log("\n")

    console.log("===DATA STORAGE===");
    console.log(dsAddress);
    console.log("ID: " + await dataStorage.getID());
    console.log("OWNER: " + await dataStorage.getOwner());
    console.log("MASTER: " + await dataStorage.getMaster());
    console.log("JETTON_WALLET: " + await dataStorage.getJettonWalletAddress());
    console.log("ACTIVE KEYS: " + await dataStorage.getActiveKeys());
}