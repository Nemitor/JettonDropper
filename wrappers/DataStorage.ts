import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type DataStorageConfig = {
    master: Address
    wallet_address: Address
    owner: Address
    data_tree_root: Cell
};

export function dataStorageConfigToCell(config: DataStorageConfig): Cell {
    return beginCell()
        .storeAddress(config.master)
        .storeAddress(config.wallet_address)
        .storeAddress(config.owner)
        .storeRef(config.data_tree_root)
        .endCell();
}
export const Opcodes = {
    data_check: 0x8e8764dd,
    setwallet: 0x9e8764cc,
}

export class DataStorage implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new DataStorage(address);
    }

    static createFromConfig(config: DataStorageConfig, code: Cell, workchain = 0) {
        const data = dataStorageConfigToCell(config);
        const init = { code, data };
        return new DataStorage(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTest(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.setwallet,32)
                .endCell()
        });
    }


    async getDataTreeRoot(provider: ContractProvider){
        const result = await provider.get('get_data_tree_root', []);
        return result.stack.readCell();
    }
}
