import { TxEntity, TxType } from "../entities/watcher/network/TransactionEntity";
import { ErgoNetwork } from "./network/ergoNetwork";
import { NetworkDataBase } from "../models/networkModel";
import { databaseConnection } from "./databaseConnection";
import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoConfig } from "../config/config";

const ergoConfig = ErgoConfig.getConfig();

export class TransactionQueue {
    _database: NetworkDataBase
    _databaseConnection: databaseConnection

    constructor(db: NetworkDataBase, dbConnection: databaseConnection) {
        this._database = db
        this._databaseConnection = dbConnection
    }

    job = async () => {
        const txs: Array<TxEntity> = await this._database.getAllTxs()
        const currentTime: number = new Date().getTime()
        for(const tx of txs) {
            try {
                const txStatus = await ErgoNetwork.getConfNum(tx.txId)
                if (txStatus === -1) {
                    const signedTx = wasm.Transaction.sigma_parse_bytes(Buffer.from(tx.txSerialized))
                    if(
                        // commitment validation
                        (tx.type == TxType.COMMITMENT &&
                            !(await this._databaseConnection.isObservationValid(tx.observation))) ||
                        // trigger validation
                        (tx.type == TxType.TRIGGER &&
                            !(await this._databaseConnection.isMergeHappened(tx.observation.requestId))) ||
                        // transaction input validation
                        !(await ErgoNetwork.txInputsCheck(signedTx.inputs()))
                    ){
                        if(currentTime - tx.updateTime > ergoConfig.transactionRemovingTimeout) {
                            await this._database.downgradeObservationTxStatus(tx.observation)
                            await this._database.removeTx(tx)
                        }
                        continue
                    }
                    // resend the tx
                    await ErgoNetwork.sendTx(signedTx.to_json())
                    await this._database.updateTxTime(tx, currentTime)
                } else if (txStatus > ergoConfig.transactionConfirmation) {
                    await this._database.upgradeObservationTxStatus(tx.observation)
                    await this._database.removeTx(tx)
                } else {
                    await this._database.updateTxTime(tx, currentTime)
                }
            } catch (e) {
                console.log(e)
                console.log("Skipping transaction checking with txId:", tx.txId)
            }
        }
    }
}

