import { Injectable } from "@nestjs/common";
import { PortfolioGroupRepository } from "./portfolio-group.repository";
import { GroupUniqueIdentifier } from "./portfolio-group.types";

@Injectable()
export class PortfolioGroupService {
    constructor(
        private readonly portfolioGroupRepository: PortfolioGroupRepository,
    ) {}

    async getById(
        groupId: GroupUniqueIdentifier,
        userId: string,
    ) {
        return await this.portfolioGroupRepository.findById(
            groupId,
            userId,
        );
    }

    async getAll(userId: string) {
        return await this.portfolioGroupRepository.findAll(userId);
    }
}
