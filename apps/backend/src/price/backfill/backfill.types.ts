import { Resolution } from "../price.abstract";

export type JobData = {
    asset: string;
    from: Date;
    to: Date;
    resolution: Resolution;
};
