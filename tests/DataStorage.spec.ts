import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, beginCell, Cell, BitString, toNano} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import {CreateDataCell} from "../dataStorage/CellCreator";

describe('DataStorage', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('DataStorage');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let dataStorage: SandboxContract<DataStorage>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();


        dataStorage = blockchain.openContract(DataStorage.createFromConfig({
            master: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            jetton_wallet_addres:  Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            owner:  Address.parse("0QDU-Ityi50zT5jKDyZXtQ0eLfKV_30gqA0MPFFOQHh2WwzS"),
            data_tree_root: CreateDataCell(98),
            ctx_id: Math.floor(Math.random() * 10000),
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await dataStorage.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dataStorage.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {

        await blockchain.setVerbosityForAddress(dataStorage.address,
            {vmLogs: 'vm_logs',
            print: true,
            blockchainLogs: false,
            debugLogs: true})
        // the check is done inside beforeEach
        // blockchain and dataStorage are ready to use
        // console.log(await dataStorage.getDataTreeRoot());
    });
});
