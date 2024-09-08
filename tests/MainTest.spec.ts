import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, beginCell, Cell, toNano, Dictionary} from '@ton/core';
import { DataStorage } from '../wrappers/DataStorage';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import {bufferToInt, hashToInt, MerkleTree} from "../merkle/merkle";
import {JettonDropper} from "../wrappers/JettonDropper";

const generateKeys = (seed: number, count: bigint): bigint[] => {
    const keys: bigint[] = [];
    const seedBuffer = Buffer.from(seed.toString());

    for (let i = 0n; i < count; i++) {
        // Создаем буфер, комбинируя seed и текущую итерацию
        const keyBuffer = Buffer.concat([seedBuffer, Buffer.from(i.toString())]);
        // Хэшируем буфер и преобразуем его в bigint
        const hashedKey = hashToInt(keyBuffer);
        // Обрезаем до 32 бит
        const truncatedKey = hashedKey & 0xFFFFFFn;
        keys.push(truncatedKey);
    }

    return keys;
};

// Укажите константу и количество ключей
const seed = 99999;
const keyCount = 2n ** 17n;
const keys = generateKeys(seed, keyCount);

const merkleHash = (a: bigint, b: bigint) => bufferToInt(beginCell().storeUint(a, 256).storeUint(b, 256).endCell().hash());
const merkle = MerkleTree.fromLeaves(keys, merkleHash);


describe('Claiming and second claiming', () => {
    let code: Cell;
    let code1: Cell;

    beforeAll(async () => {
        code = await compile('DataStorage');
        code1 = await compile('JettonDropper');
    });

    let blockchain: Blockchain;
    let contractAdmin: SandboxContract<TreasuryContract>;
    let dataStorage: SandboxContract<DataStorage>;
    let jettonDropper: SandboxContract<JettonDropper>;
    let jettonWallet: SandboxContract<TreasuryContract>;
    let claimer: SandboxContract<TreasuryContract>;


    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());

        //Заполнение DICT
        for (let i = 0; i < 98; i++) {
            const cell = beginCell().storeUint(0,1023).endCell();
            dict.set(i, cell);
        }

        contractAdmin = await blockchain.treasury('deployer');
        jettonWallet = await blockchain.treasury('Jetton wallet');
        claimer = await blockchain.treasury('claimer');

        dataStorage = blockchain.openContract(DataStorage.createFromConfig({
            master: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
            jetton_wallet_address:  jettonWallet.address,
            owner:  contractAdmin.address,
            data_tree_root: dict,
            ctx_id: Math.floor(Math.random() * 10000),
        }, code));

        const dataStorageDeployRes = await dataStorage.sendDeploy(contractAdmin.getSender(), toNano('0.05'));

        expect(dataStorageDeployRes.transactions).toHaveTransaction({
            from: contractAdmin.address,
            to: dataStorage.address,
            deploy: true,
            success: true,
        });

        jettonDropper = blockchain.openContract(
            JettonDropper.createFromConfig(
                {
                    merkle_root: merkle.root(),
                    merkle_depth: merkle.depth,
                    owner: contractAdmin.address,
                    data_tree_contract_addr: dataStorage.address,
                    id: Math.floor(Math.random() * 10000),
                },
                await compile('JettonDropper')
            )
        );
        const jettonDropperDeployRes = await jettonDropper.sendDeploy(contractAdmin.getSender(), toNano('0.05'));

        expect(jettonDropperDeployRes.transactions).toHaveTransaction({
            from: contractAdmin.address,
            to: jettonDropper.address,
            deploy: true,
            success: true,
        });

        expect((await jettonDropper.getDataTreeContractAddr()).toString())
            .toEqual(dataStorage.address.toString());


        const dataStorageUpdateMaster = await dataStorage.sendUpdateMaster(contractAdmin.getSender() ,{
            value: toNano('0.05'),
            master: jettonDropper.address
        })

        expect(dataStorageUpdateMaster.transactions).toHaveTransaction({
            from: contractAdmin.address,
            to: dataStorage.address,
            success: true,
        });

        expect((await dataStorage.getMaster()).toString())
            .toEqual(jettonDropper.address.toString());

    });

    it('should claim', async () => {
        //
        // await blockchain.setVerbosityForAddress(dataStorage.address,
        //     {vmLogs: 'vm_logs',
        //     print: true,
        //     blockchainLogs: false,
        //     debugLogs: true})

        let claimIndex = 0;

        let claimData =  await jettonDropper.sendClaim(claimer.getSender(),{
            value: toNano("0.03"),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(claimIndex)),
            leaf: merkle.leaf(claimIndex),
            leaf_index: claimIndex,
        })

        expect(claimData.transactions).toHaveTransaction({
            from: dataStorage.address,
            to: jettonWallet.address,
            success: true
        })

    });

    it('cant claim twice with same key', async () => {
        let claimIndex = 0;

        let claimData =  await jettonDropper.sendClaim(claimer.getSender(),{
            value: toNano("0.03"),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(claimIndex)),
            leaf: merkle.leaf(claimIndex),
            leaf_index: claimIndex,
        })

        expect(claimData.transactions).toHaveTransaction({
            from: dataStorage.address,
            to: jettonWallet.address,
            success: true
        })

        let secondClaim =  await jettonDropper.sendClaim(claimer.getSender(),{
            value: toNano("0.03"),
            proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(claimIndex)),
            leaf: merkle.leaf(claimIndex),
            leaf_index: claimIndex,
        })
        expect(secondClaim.transactions).toHaveTransaction({
            from: jettonDropper.address,
            to: dataStorage.address,
            success: false,
        })
    });

    it('working with all keys', async () => {
        for (let claimIndex = 0; claimIndex < 10; claimIndex++){

            let claimData = await jettonDropper.sendClaim(claimer.getSender(),{
                value: toNano("0.03"),
                proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(claimIndex)),
                leaf: merkle.leaf(claimIndex),
                leaf_index: claimIndex,
            })

            expect(claimData.transactions).toHaveTransaction({
                from: dataStorage.address,
                to: jettonWallet.address,
                success: true
            })

            let secondClaim = await jettonDropper.sendClaim(claimer.getSender(),{
                value: toNano("0.03"),
                proof: merkle.proofForNode(merkle.leafIdxToNodeIdx(claimIndex)),
                leaf: merkle.leaf(claimIndex),
                leaf_index: claimIndex,
            })
            expect(secondClaim.transactions).toHaveTransaction({
                from: jettonDropper.address,
                to: dataStorage.address,
                success: false,
            })
        }
    });
});
