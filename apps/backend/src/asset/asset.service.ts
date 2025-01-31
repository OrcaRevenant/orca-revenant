import { Injectable } from "@nestjs/common";
import { AssetRepository } from "./asset.repository";

@Injectable()
export class AssetService {
    constructor(private readonly assetRepository: AssetRepository) {}

    async findAll() {
        return this.assetRepository.findAll();
    }
}
