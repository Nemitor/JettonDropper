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

export type JettonDropperConfig = {
    merkle_root: bigint;
    merkle_depth: number;
    owner: Address;
    jetton_wallet_adr: Address;
    id: number;
    senq: number;
};

export function jettonDropperConfigToCell(config: JettonDropperConfig): Cell {
    return beginCell()
        .storeUint(config.merkle_root, 256)
        .storeUint(config.merkle_depth, 8)
        .storeAddress(config.owner)
        .storeAddress(config.jetton_wallet_adr)
        .storeUint(config.id, 32)
        .storeUint(config.senq, 32)
        .endCell();
}

export const Opcodes = {
    setroot: 0x7e8764cc,
    claim: 0x8e8764cc,
    setwallet: 0x9e8764cc,
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

    async sendSetRoot(
        provider: ContractProvider,
        via: Sender,
        opts:{
            value: bigint;
            merkle_root: bigint;
            merkle_depth: number;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.setroot, 32)
                .storeUint(opts.merkle_root, 256)
                .storeUint(opts.merkle_depth, 8)
                .endCell(),
        });
    }

    async sendSetWallet(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            wallet: Address;
        }
    ){
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.setroot, 32)
                .storeAddress(opts.wallet)
                .endCell(),
        });
    }

    async sendClaim(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            proof: bigint[],
            leaf: bigint,
            leaf_index: number,
        }
    ){
        const proofDict = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.BigUint(256));

        for (let i = 0; i < opts.proof.length; i++) {
            proofDict.set(i, opts.proof[i]);
        }

        const pdb = beginCell();
        proofDict.storeDirect(pdb);
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.claim, 32)
                .storeRef(pdb)
                .storeUint(opts.leaf, 32)
                .storeUint(opts.leaf_index , 32)
                .endCell(),
        });
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }

    async getMerkleRoot(provider: ContractProvider) {
        const result = await provider.get('get_merkle_root', []);
        return result.stack.readBigNumber();
    }

    async getMerkleDepth(provider: ContractProvider) {
        const result = await provider.get('get_merkle_depth', []);
        return result.stack.readNumber();
    }

    async getSenq(provider: ContractProvider) {
        const result = await provider.get('get_senq', []);
        return result.stack.readNumber();
    }

    async get_jetton_wallet_adr(provider: ContractProvider) {
        const result = await provider.get('get_jetton_wallet_adr', []);
        return result.stack.readAddress();
    }
}
