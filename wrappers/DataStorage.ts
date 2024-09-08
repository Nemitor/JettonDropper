import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode
} from '@ton/core';

export type DataStorageConfig = {
    master: Address
    jetton_wallet_address: Address
    owner: Address
    data_tree_root: Dictionary<any, any>
    ctx_id: number
};

export function dataStorageConfigToCell(config: DataStorageConfig): Cell {
    return beginCell()
        .storeAddress(config.master)
        .storeAddress(config.jetton_wallet_address)
        .storeAddress(config.owner)
        .storeUint(0,32) //Activate keys
        .storeUint(config.ctx_id,32)
        .storeDict(config.data_tree_root)
        .endCell();
}
export const Opcodes = {
    data_check: 0x8e8764dd,
    setwallet: 0x9e8764cc,
    op_admin_withdraw: 0x1ecc4cc,
    update_master: 0x1bbb4cc,
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

    async sendAdminWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts:{
            value: bigint;
            amount: bigint;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.op_admin_withdraw, 32)
                .storeUint(opts.amount,32)
                .endCell(),
        });
    }
    async sendUpdateMaster(
        provider: ContractProvider,
        via: Sender,
        opts:{
            value: bigint;
            master: Address;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.update_master, 32)
                .storeAddress(opts.master)
                .endCell(),
        });
    }
    async sendSetWallet(
        provider: ContractProvider,
        via: Sender,
        opts:{
            value: bigint;
            wallet: Address;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.setwallet, 32)
                .storeAddress(opts.wallet)
                .endCell(),
        });
    }

    async getDataTreeRoot(provider: ContractProvider){
        const result = await provider.get('get_data_tree_root', []);
        return result.stack.readCell();
    }

    async getID(provider: ContractProvider){
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }

    async getMaster(provider: ContractProvider){
        const result = await provider.get('get_master', []);
        return result.stack.readAddress();
    }
    async getJettonWalletAddress(provider: ContractProvider){
        const result = await provider.get('get_jetton_wallet_address', []);
        return result.stack.readAddress();
    }
    async getOwner(provider: ContractProvider){
        const result = await provider.get('get_owner', []);
        return result.stack.readAddress();
    }
    async getActiveKeys(provider: ContractProvider){
        const result = await provider.get('get_activate_keys', []);
        return result.stack.readNumber();
    }
}
