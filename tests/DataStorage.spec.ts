import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, beginCell, Cell, BitString, toNano, Dictionary} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('DataStorage', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('DataStorage');
    });

    let blockchain: Blockchain;
    let attacker: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let dataStorage: SandboxContract<DataStorage>;
    let jettonWallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());

        // Заполняем словарь 10-ю Cell, пронумерованными от 1 до 10
        for (let i = 0; i < 98; i++) {
            const cell = beginCell().storeUint(0,1023).endCell();
            dict.set(i, cell);
        }
        admin = await blockchain.treasury('deployer');
        attacker = await blockchain.treasury('attacker')
        jettonWallet = await blockchain.treasury('jetton')

        dataStorage = blockchain.openContract(DataStorage.createFromConfig({
            master: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            jetton_wallet_address: jettonWallet.address,
            owner:  admin.address,
            data_tree_root: dict,
            ctx_id: Math.floor(Math.random() * 10000),
        }, code));


        const deployResult = await dataStorage.sendDeploy(admin.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: dataStorage.address,
            deploy: true,
            success: true,
        });
    });

    it('master should update and protect', async () => {
        let targetMaster = await blockchain.treasury('master');

        await dataStorage.sendUpdateMaster(admin.getSender(),{
            value: toNano('0.05'),
            master: targetMaster.address,
        })

        let masterAfter = await dataStorage.getMaster();

        expect(masterAfter.toString()).toEqual(targetMaster.address.toString())

        let masterBeforeAttack = await dataStorage.getMaster();

        let attack = await dataStorage.sendUpdateMaster(attacker.getSender(),{
            value: toNano('0.05'),
            master: dataStorage.address
        })

        expect((await dataStorage.getMaster()).toString())
            .toBe(masterBeforeAttack.toString())

        expect(attack.transactions).toHaveTransaction({
            from: attacker.address,
            to: dataStorage.address,
            success: false,
        })
    });

    it('only admin, can withdraw and protect', async () => {
        let withdrawData = await dataStorage.sendAdminWithdraw(admin.getSender(),{
            value:toNano('0.05'),
            amount: 10n
        });
        expect(withdrawData.transactions).toHaveTransaction({
            from: dataStorage.address,
            to: jettonWallet.address,
        });
        expect(withdrawData.transactions).toHaveTransaction({
            from: admin.address,
            to: dataStorage.address,
            success: true,
        });

        let attack = await dataStorage.sendAdminWithdraw(attacker.getSender(),{
            value:toNano('0.05'),
            amount: 10n
        });
        expect(attack.transactions).toHaveTransaction({
            from: attacker.address,
            to: dataStorage.address,
            success: false,
        });
    });

    it('set wallet should be updated and protected', async () => {
        let newJettonWallet = await blockchain.treasury('new');


        let walletUpdateData = await dataStorage.sendSetWallet(admin.getSender(),{
            value: toNano("0.05"),
            wallet: newJettonWallet.address,
        })

        let walletAfter = await dataStorage.getJettonWalletAddress();

        expect(walletAfter.toString())
            .toBe(newJettonWallet.address.toString());

        let attack = await dataStorage.sendSetWallet(attacker.getSender(),{
            value: toNano("0.05"),
            wallet: attacker.address,
        })

        expect(attack.transactions).toHaveTransaction({
            from: attacker.address,
            to: dataStorage.address,
            success: false,
        })
    });
});
