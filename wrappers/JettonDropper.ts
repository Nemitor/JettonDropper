import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type JettonDropperConfig = {
    merkle_root: number;
    merkle_depth: number;
    owner: Address;
    id: number;
    counter: number;
    node_dict_key_len: number;
    senq: number;
};

export function jettonDropperConfigToCell(config: JettonDropperConfig): Cell {
    return beginCell()
        .storeUint(config.merkle_root, 256)
        .storeUint(config.merkle_depth, 8)
        .storeAddress(config.owner)
        .storeUint(config.id, 32)
        .storeUint(config.counter, 32)
        .storeInt(config.node_dict_key_len, 32)
        .storeUint(config.senq, 32)
        .endCell();
}

export const Opcodes = {
    increase: 0x7e8764ef,
    setroot: 0x7e8764cc,
    claim: 0xc1a1c,
};

export class JettonDropper implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonDropper(address);
    }

    static createFromConfig(config: JettonDropperConfig, code: Cell, workchain = 0) {
        const data = jettonDropperConfigToCell(config);
        const init = { code, data };
        return new JettonDropper(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: number;
            value: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.increase, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.increaseBy, 32)
                .endCell(),
        });
    }

    async sendSetRoot(
        provider: ContractProvider,
        via: Sender,
        opts:{
            value: bigint;
            merkle_root: number;
            merkle_depth: number;
            queryID?: number;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.setroot, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.merkle_root, 256)
                .storeUint(opts.merkle_depth, 8)
                .endCell(),
        });
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('get_counter', []);
        return result.stack.readNumber();
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }

    async get_merkle_root(provider: ContractProvider) {
        const result = await provider.get('get_merkle_root', []);
        return result.stack.readNumber();
    }

    async get_merkle_depth(provider: ContractProvider) {
        const result = await provider.get('get_merkle_depth', []);
        return result.stack.readNumber();
    }
}
