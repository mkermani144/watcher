import { DataSource, In, Repository } from "typeorm";
import { BoxEntity } from "@rosen-bridge/address-extractor";
import { PermitEntity, CommitmentEntity } from "@rosen-bridge/watcher-data-extractor";

export class BridgeDataBase{
    private rosenDataSource: DataSource;
    private commitmentRepository: Repository<CommitmentEntity>;
    private permitRepository: Repository<PermitEntity>;
    private boxRepository: Repository<BoxEntity>;

    constructor(rosenDataSource: DataSource, addressDataSource: DataSource) {
        this.rosenDataSource = rosenDataSource;
        this.commitmentRepository = rosenDataSource.getRepository(CommitmentEntity);
        this.permitRepository = rosenDataSource.getRepository(PermitEntity);
        this.boxRepository = addressDataSource.getRepository(BoxEntity);
    }

    /**
     * returns old spent commitments
     * @param height
     */
    getOldSpentCommitments = async (height: number) => {
        return await this.commitmentRepository.createQueryBuilder("commitment_entity")
            .where("commitment_entity.spendBlockHeight < :height", {height})
            .getMany()
    }

    /**
     * delete commitments by their box ids
     * @param ids
     */
    deleteCommitments = async (ids: Array<string>) => {
        await this.commitmentRepository.delete({commitmentBoxId: In(ids)})
    }

    /**
     * find commitments by their box ids
     * @param ids
     */
    findCommitmentsById = async (ids: Array<string>): Promise<Array<CommitmentEntity>> => {
        return await this.commitmentRepository.find({
            where: {
                commitmentBoxId: In(ids)
            }
        })
    }

    /**
     * Returns all commitments related to a specific event
     * @param eventId
     */
    commitmentsByEventId = async (eventId: string): Promise<Array<CommitmentEntity>> => {
        return await this.commitmentRepository.find({
            where: {
                eventId: eventId
            }
        })
    }


    getUnspentPermitBoxes = async () => {
        return this.permitRepository.createQueryBuilder("permit_entity")
            .where("spendBlock is null")
            .getMany()
    }

    getUnspentPlainBoxes = async () => {
        return this.boxRepository.createQueryBuilder("box_entity")
            .where("extractor = :extractor AND spendBlock is null", {
                "extractor": "plainBoxExtractor"
            })
            .getMany()
    }

    getUnspentWIDBoxes = async () => {
        return this.boxRepository.createQueryBuilder("box_entity")
            .where("extractor = :extractor AND spendBlock is null", {
                "extractor": "WIDBoxExtractor"
            })
            .getMany()
    }


    /**
     * Finds unspent special boxesSample by their box id
     * @param ids: Array of box ids
     */
    findUnspentSpecialBoxesById = async (ids: Array<string>): Promise<Array<BoxEntity>> => {
        return await this.boxRepository.find({
            where: {
                spendBlock: undefined,
                boxId: In(ids)
            }
        })
    }
}