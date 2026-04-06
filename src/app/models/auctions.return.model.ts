import { AuctionDataModel } from "./auction.data.model";

export interface AuctionsReturnModel {
    auctions: AuctionDataModel[];
    total_rows: number;
}