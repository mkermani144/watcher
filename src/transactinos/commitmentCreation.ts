import * as wasm from "ergo-lib-wasm-nodejs";
import { contracts } from "../contracts/contracts";
import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import config from "config";
import { boxes } from "../ergoUtils/boxes";
import { commitmentFromObservation, contractHash, createAndSignTx } from "../ergoUtils/ergoUtils";
import { NetworkDataBase } from "../models/networkModel";
import { boxCreationError } from "../utils/utils";

const minBoxVal = parseInt(config.get?.('ergo.minBoxVal'))
const txFee = parseInt(config.get?.('ergo.txFee'))
const WID: string = config.get('ergo.WID')

export class commitmentCreation {
    _dataBase: NetworkDataBase
    _requiredConfirmation: number

    constructor(db: NetworkDataBase, confirmation: number) {
        this._dataBase = db
        this._requiredConfirmation = confirmation
    }

    /**
     * creates the commitment transaction and sends it to the network
     * @param WID
     * @param requestId
     * @param eventDigest
     * @param permits
     * @param WIDBox
     */
    createCommitmentTx = async (WID: string,
                                requestId: string,
                                eventDigest: Uint8Array,
                                permits: Array<wasm.ErgoBox>,
                                WIDBox: wasm.ErgoBox): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()
        const permitHash = contractHash(contracts.addressCache.permitContract!)
        const outCommitment = boxes.createCommitment(minBoxVal, height, WID, requestId, eventDigest, permitHash)
        const RWTCount: number = permits.map(permit =>
            permit.tokens().get(0).amount().as_i64().as_num())
            .reduce((a, b) => a + b, 0)
        const outPermit = boxes.createPermit(minBoxVal, height, RWTCount - 1, WID)
        const rewardValue = permits.map(permit => permit.value().as_i64().as_num()).reduce((a, b) => a + b, 0)
        // TODO: Complete Watcher Payment (Token rewards)
        // Don't forget to consider WIDBox assets
        // const paymentTokens: Array<wasm.Token> = permits.map(permit => extractTokens(permit.tokens())).
        const paymentValue = WIDBox.value().as_i64().as_num() + rewardValue - txFee - 2 * minBoxVal
        const watcherPayment = boxes.createPayment(paymentValue, height, [])
        const inputBoxes = new wasm.ErgoBoxes(WIDBox);
        permits.forEach(permit => inputBoxes.add(permit))
        try {
            const signed = await createAndSignTx(
                config.get("ergo.secret"),
                inputBoxes,
                [outPermit, outCommitment, watcherPayment],
                height
            )
            await ErgoNetworkApi.sendTx(signed.to_json())
            return signed.id().to_str()
        } catch (e) {
            if (e instanceof boxCreationError) {
                console.log("Transaction input and output doesn't match. Input boxes assets must be more or equal to the outputs assets.")
            }
            console.log("Skipping the commitment creation.")
            return ""
        }
    }

    /**
     * Extracts the confirmed observations and creates the commitment transaction
     * Finally saves the created commitment in the database
     */
    job = async () => {
        const observations = await this._dataBase.getConfirmedObservations(this._requiredConfirmation)
        for (const observation of observations) {
            const commitment = commitmentFromObservation(observation, WID)
            const permits = await boxes.getPermits(WID)
            const WIDBox = await boxes.getWIDBox(WID)
            const txId = await this.createCommitmentTx(WID, observation.requestId, commitment, permits, WIDBox[0])
            await this._dataBase.saveCommitment({
                eventId: observation.requestId,
                commitment: commitment.toString(),
                commitmentBoxId: "",
                WID: WID
            }, txId, observation.id)
        }
    }
}
