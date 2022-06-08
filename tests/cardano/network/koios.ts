import { expect } from "chai";
import { KoiosNetwork } from "../../../src/cardano/network/koios";

describe("Koios Apis", () => {
    describe("getBlockAtHeight", () => {
        it("Should return a json with hash and block_height field", async () => {
            const koiosNetwork = new KoiosNetwork();
            const data = await koiosNetwork.getBlockAtHeight(3433333);
            expect(data).to.eql({
                "hash": "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6",
                "block_height": 3433333
            });
        });
    });
    describe("getBlock", () => {
        it("get the last block offset=0 and limit=1", async () => {
            const koiosNetwork = new KoiosNetwork();
            const data = await koiosNetwork.getCurrentHeight();
            expect(data).to.equal(3433334);
        });

    });
    describe("getBlockTxs", () => {
        it("get the block transactions with block hash", async () => {
            const koiosNetwork = new KoiosNetwork();
            const data = await koiosNetwork.getBlockTxs(
                "26197be6579e09c7edec903239866fbe7ff6aee2e4ed4031c64d242e9dd1bff6"
            );
            expect(data).to.eql([
                "18c74381954f093a3ca919df4380c9d9111396b9ad95bf4f16a94355d52cabc0",
                "6c8368f62a91e6687dc677feb27f7724fcb398509ecd2bdde1866ed49353918d",
                "b194ce1c11399822eb7f3288a67fbb0e295b7954f170ecacfc779a886dd11179",
                "0ea5fb179e359bfb5de00831eb58fa830d8d6eede0b0c9eaa09286439616a340",
                "ccb85a5f2f10bd1468e0cd9679a6bea360962747e2b60b73fa43abe98b09d15c",
                "03cf541bfe93ede8489e0a3f1f1f94e34a4116399f8bd03619efca192961e47a",
                "1a0d06c44fa9bb4fce5900e2d31031f9db38da29f4acc9d525c30dae67ea6609",
                "b092027357f70831dd34dd34cea54146c11e844dc194b4c2ea841bce7cd19816"
            ])
        });
    });
    describe("getTxUtxos", () => {
        it("get one tx utxos", async () => {
            const koiosNetwork = new KoiosNetwork();
            const data = await koiosNetwork.getTxUtxos(["cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"]);
            expect(data).to.be.eql(
                [{
                    utxos: [{
                        payment_addr: {
                            bech32: 'addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re',
                            cred: "b3e2001f41f12f92e2f484c821e98a6e60f39adc7ff30fb248819c21"
                        },
                        tx_hash: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
                        stake_addr: null,
                        tx_index: 0,
                        value: '10000000',
                        asset_list: [
                            {
                                policy_id: 'ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2',
                                asset_name: '7369676d61',
                                quantity: '10'
                            }
                        ]
                    }, {
                        payment_addr: {
                            bech32: 'addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0',
                            cred: "90ff35400c4d2cbddef24a750ad7064947a2461c1a0b9ca431c7e9f6"
                        },
                        tx_hash: 'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa',
                        stake_addr: null,
                        tx_index: 1,
                        value: '969261084',
                        asset_list: [
                            {
                                policy_id: 'ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2',
                                asset_name: '646f6765',
                                quantity: '10000000'
                            },
                            {
                                policy_id: 'ace7bcc2ce705679149746620de3a84660ce57573df54b5a096e39a2',
                                asset_name: '7369676d61',
                                quantity: '9999968'
                            }
                        ]
                    }]
                }]
            );
        });
    });
    describe("getTxMetaData", () => {
        it("get one tx metaData", async () => {
            const koiosNetwork = new KoiosNetwork();
            const data = await koiosNetwork.getTxMetaData(["cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa"]);
            expect(data[0]).to.be.eql({
                "tx_hash": "cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa",
                "metadata": {
                    "0": {
                        "to": "ERGO",
                        "fee": "10000",
                        "from": "CARDANO",
                        "toAddress": "ergoAddress",
                        "fromAddress": "cardanoAddress",
                        "targetChainTokenId": "cardanoTokenId"
                    }
                }
            });
        });
    });
});
