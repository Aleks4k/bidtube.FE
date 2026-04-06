import { MenuItem } from "primeng/api"
import { BidDataModel } from "./bid.data.model"
import { SafeHtml } from "@angular/platform-browser"

export interface AuctionDataModel {
    id:number,
    username: string,
    average_rating: number,
    total_reviews: number,
    category_id: number,
    title: string,
    description: string,
    startPrice: number,
    date_of_auction: Date,
    date_of_expiration: Date,
    images: AuctionImageDataModel[],
    top_bid: BidDataModel,
    breadcrumb_items : MenuItem[],
    sanitized_desc: SafeHtml,
    activeIndex: number,
    secondsLeft: number,
    imageLoaded: boolean,
    auctionEnded: boolean,
}
export interface AuctionImageDataModel {
    id: number,
    auction_id: number,
    url: string,
    alt_text: string
}