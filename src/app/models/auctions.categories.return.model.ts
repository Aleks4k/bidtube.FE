import { AuctionsReturnModel } from "./auctions.return.model";
import { CategoryPostAuctionModel } from "./category.post.auction.model";

export interface AuctionsCategoriesReturnDto {
    categories: CategoryPostAuctionModel;
    auctions: AuctionsReturnModel;
}