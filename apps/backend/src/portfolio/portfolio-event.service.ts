import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";
import { PortfolioStatusUpdate } from "./portfolio.types";

@Injectable()
export class PortfolioEventService {
    private portfolioStatusUpdates = new Subject<PortfolioStatusUpdate>();

    getEvents() {
        return this.portfolioStatusUpdates.asObservable();
    }

    sendEvent(payload: PortfolioStatusUpdate): void {
        this.portfolioStatusUpdates.next(payload);
    }
}
