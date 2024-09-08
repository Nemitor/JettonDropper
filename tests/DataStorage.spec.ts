import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, beginCell, Cell, BitString, toNano} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

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

        let buffer = Buffer.alloc(128);

        buffer[0] = 0b00000000;

        let bitString = new BitString(buffer, 0, 1023);

        let dataCell = beginCell()
            .storeBits(bitString)
            .storeRef(beginCell().storeBits(bitString).endCell())
            .storeRef(beginCell().storeBits(bitString).endCell())
            .storeRef(beginCell().storeBits(bitString).endCell())
            .storeRef(beginCell().storeBits(bitString).endCell())
            .endCell()

        dataStorage = blockchain.openContract(DataStorage.createFromConfig({
            master: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            wallet_address:  Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            owner:  Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            data_tree_root: dataCell
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
        console.log(await dataStorage.getDataTreeRoot());

        const res = await dataStorage.sendTest(deployer.getSender(), {
            value: toNano('0.05'),
        });

        console.log(await dataStorage.getDataTreeRoot());
    });
});
