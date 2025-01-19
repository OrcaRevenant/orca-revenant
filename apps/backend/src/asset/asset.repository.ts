import { Injectable } from "@nestjs/common";
import { Asset } from "./asset.types";
import { DatabaseService } from "@/database/database.service";

@Injectable()
export class AssetRepository {
    constructor(private readonly db: DatabaseService) {}

    async findAll(): Promise<Asset[]> {
        const assets = await this.db.query
            .selectFrom("asset")
            .selectAll()
            .execute();

        return assets;
    }
}
