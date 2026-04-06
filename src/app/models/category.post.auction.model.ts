export interface CategoryDto {
    key: string;
    label: string;
    parent_category_id?: number;
    icon_name: string;
    children: CategoryDto[];
}
export interface CategoryPostAuctionModel {
    categories: CategoryDto[];
}