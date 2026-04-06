import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TreeModule, TreeNodeSelectEvent } from 'primeng/tree';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { CategoryDto } from '../../models/category.post.auction.model';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { SkeletonModule } from 'primeng/skeleton';
import { AuctionsCategoriesReturnDto } from '../../models/auctions.categories.return.model';
import { AuctionDataModel } from '../../models/auction.data.model';
import { DomSanitizer } from '@angular/platform-browser';
import { AuctionComponent } from '../../elements/auction/auction.component';
import { DropdownChangeEvent, DropdownModule } from 'primeng/dropdown';
import { AuctionSortOption } from '../../models/auction.sort.option';
import { FormsModule } from '@angular/forms';
import { ScrollTopModule } from 'primeng/scrolltop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AuctionsReturnModel } from '../../models/auctions.return.model';
import { HubService } from '../../services/hub.service';
import { BidDataModel } from '../../models/bid.data.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [ PaginatorModule, ScrollTopModule, FormsModule, DropdownModule, TreeModule, ButtonModule, SidebarModule, SkeletonModule, AuctionComponent, CommonModule ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
  private auctionUpdateSub!: Subscription;
  first: number = 0;
  rows: number = 10;
  total_records: number = 0;
  steps_skeleton: number[] = [0,1,2,3,4,5,6,7,8,9];
  isCategorySideBarVisible: boolean = false;
  isOrderSideBarVisible: boolean = false;
  categories_model: CategoryDto[] = []; //Categories but as iterable array not as tree.
  categories_model_filtered_by_icon: CategoryDto[] = []; //Array needed to show categories at top on small screens.
  categories!: TreeNode[];
  selectedCategory: TreeNode | undefined;
  selectedCategory_filter: TreeNode | undefined; //Koristi se za finalno filtriranje a ova iznad za treelist.
  auctions!: AuctionDataModel[];
  categoryDataLoaded: boolean = false;
  auctionDataLoaded: boolean = false;
  sort_options: AuctionSortOption[] | undefined;
  selectedOption: AuctionSortOption | undefined;
  selectedOptionTemp: AuctionSortOption | undefined;
  constructor(private hubService: HubService, private sanitizer:DomSanitizer, private _api: ApiService, private _message: MessageService){}
  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.sort_options = [
      { label: 'Newest First', key: 0, sort: 0, order: 0 },
      { label: 'Oldest First', key: 1, sort: 0, order: 1 },
      { label: 'Closest to Expiration', key: 2, sort: 1, order: 1 },
      { label: 'Farthest from Expiration', key: 3, sort: 1, order: 0 },
      { label: 'Price Ascending', key: 4, sort: 2, order: 1 },
      { label: 'Price Descending', key: 5, sort: 2, order: 0 }
    ];
    this.selectedOption = this.sort_options[0]; 
    this.selectedOptionTemp = this.sort_options[0]; 
    this._api.post("api/Auction/getAuctionsWithCategories", {
      auction : {
        category_id: 0,
        sort_type: 0,
        order_type: 0,
        pagination_direction_type: 0
      }
    }).subscribe({
      next: (v: AuctionsCategoriesReturnDto) => {
        //Sređujemo kategorije
        this.categories = v.categories.categories;
        for (const item of v.categories.categories) {
          if (item.parent_category_id === null) {
            this.traverse(item);
          }
        }
        this.categories_model_filtered_by_icon = this.categories_model.filter(c => c.icon_name !== null);
        //Sređujemo aukcije
        this.total_records = v.auctions.total_rows;
        this.auctions = v.auctions.auctions;
        for(const item of this.auctions){
          item.date_of_auction = this.convertToUserTimezone(item.date_of_auction);
          item.date_of_expiration = this.convertToUserTimezone(item.date_of_expiration);
          item.secondsLeft = (item.date_of_expiration.getTime() - new Date().getTime()) / 1000;
          item.breadcrumb_items = this.generateBreadCumbForCategory(item.category_id);
          item.sanitized_desc = this.sanitizer.bypassSecurityTrustHtml(item.description);
          item.activeIndex = 0;
          item.imageLoaded = false;
          item.auctionEnded = false;
        }
        this.categoryDataLoaded = true;
        this.auctionDataLoaded = true;
      },
      error: (e) => {
        this.categoryDataLoaded = true;
        this.auctionDataLoaded = true;
        if(e.status === 400){
          for(var obj in e.error.validationErrors){
            this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
          }
        }
      }
    })
    this.auctionUpdateSub = this.hubService.onAuctionUpdate().subscribe((message : string) => {
      const parsedObject = JSON.parse(message);
      const auction_id: number = parsedObject.auction_id;
      const top_bid: BidDataModel = { amount: parsedObject.amount };
      const auction = this.auctions.find(x => x.id === auction_id)
      if(auction){
        auction.top_bid = top_bid;
      }
    });
  }
  ngOnDestroy(): void{
    this.auctionUpdateSub.unsubscribe();
  }
  traverse(node: CategoryDto) {
    this.categories_model.push(node);
    for (const child of node.children) {
        this.traverse(child);
    }
  }
  convertToUserTimezone(date: Date): Date {
    const dateObj = new Date(date);
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - userTimezoneOffset);
  }
  generateBreadCumbForCategory(category_id: number | undefined): MenuItem[]{
    const response: MenuItem[] = [];
    while(category_id !== 0){
      var cur_cat = this.categories_model.find(x => Number(x.key) === category_id);
      if(cur_cat){
        response.push({ label: cur_cat.label });
        category_id = cur_cat.parent_category_id;
      } else {
        category_id = 0;
      }
    }
    return response.reverse();
  }
  selectCategory(category_id: string){ //Telefon ikonice na vrhu kategorije koje imaju ikonicu select.
    if(this.selectedCategory_filter !== undefined && this.selectedCategory_filter.key === category_id){
      this.selectedCategory_filter = undefined;
    } else {
      this.selectedCategory = this.categories_model.find(x => x.key === category_id); //Setujemo i ovde zbog two way bindinga.
      this.selectedCategory_filter = this.selectedCategory;
    }
    this.getAuctions(true, true, 0);
  }
  selectCategoryFromMobileTree(){ //Ovo je tek kada se klikne dugme select na tree za biranje kategorije na telefonu.
    if(this.selectedCategory){
      this.selectedCategory_filter = this.selectedCategory;
    } else {
      this.selectedCategory_filter = undefined;
    }
    this.getAuctions(true, true, 0);
  }
  selectCategoryFromTree(event: TreeNodeSelectEvent){ //Veliki ekrani
    this.selectedCategory_filter = event.node;
    this.getAuctions(true, true, 0);
  }
  unselectCategoryFromTree(){ //Veliki ekrani
    this.selectedCategory_filter = undefined;
    this.getAuctions(true, true, 0);
  }
  selectOrderFromMobileTree(){ //Mali ekran kad klikne select na tree za biranje ordera.
    if(this.selectedOptionTemp){ //Ako zapravo imamo neko polje štiklirano.
      this.selectedOption = this.selectedOptionTemp;
    } else { //Ako nije izabrao ništa nego je odcheckirao postavljamo podrazumevani sort onaj koji je bio pre otvaranja tree.
      this.selectedOptionTemp = this.selectedOption;
    }
    this.getAuctions(true, true, 0);
  }
  updateTempSelectOption(event:DropdownChangeEvent){ //Update varijable za mali ekran sa velikog ekrana.
    this.selectedOptionTemp = event.value;
    this.getAuctions(true, true, 0);
  }
  onPageChange(event: PaginatorState) {
    if(this.first === event.first!){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'You can\'t navigate between same page.' });
      return;
    }
    let direction_forward: boolean = true;
    if(this.first > event.first!){
      direction_forward = false;
    }
    let rows_to_skip: number = 0;
    if(direction_forward){
      rows_to_skip = Math.abs(this.first - event.first!) - 10;
    } else {
      rows_to_skip = event.first! //kada idemo unazad treba da preskočimo broj itema koji kaže first jer on drži prvi index itema koji treba da prikaže u zavisnosti od strane (broj_prikazanih_redova * stranica-1)
    }
    this.first = event.first!
    this.rows = event.rows!
    this.getAuctions(false, direction_forward, rows_to_skip)
  }
  getAuctions(search_options_changed: boolean, direction_forward: boolean, rows_to_skip: number){
    //search_options_changed true se dešava kada se izabere kategorija za filter ili kada se odabere nova vrsta sortiranja i ona ukazuje da se učitava sve od 1 stranice opet.
    if(search_options_changed){
      this.first = 0
      this.rows = 10
    }
    let item_filter:AuctionDataModel | undefined;
    if(this.auctions.length > 0){
      if(direction_forward){
        item_filter = this.auctions[this.auctions.length - 1];
      } else {
        item_filter = this.auctions[0];
      }
    } else {
      item_filter = undefined; //Ne bi trebalo da će biti pozvano ikada.
    }
    this.auctions = [];
    this.auctionDataLoaded = false;
    this._api.post("api/Auction/getAuctions", {
      auction : {
        category_id: this.selectedCategory_filter !== undefined ? Number(this.selectedCategory_filter.key) : 0,
        sort_type: this.selectedOption !== undefined ? this.selectedOption.sort : 0,
        order_type: this.selectedOption !== undefined ? this.selectedOption.order : 0,
        price_filter: !search_options_changed ? (item_filter!.top_bid ? item_filter!.top_bid.amount : item_filter!.startPrice) : 0,
        auction_id_filter: !search_options_changed ? item_filter!.id : 0,
        date_of_expiration_filter: !search_options_changed ? item_filter!.date_of_expiration : null,
        pagination_direction_type: direction_forward ? 0 : 1,
        rows_to_skip: rows_to_skip,
      }
    }).subscribe({
      next: (v: AuctionsReturnModel) => {
        //Sređujemo aukcije
        this.total_records = v.total_rows;
        this.auctions = v.auctions;
        for(const item of this.auctions){
          item.date_of_auction = this.convertToUserTimezone(item.date_of_auction);
          item.date_of_expiration = this.convertToUserTimezone(item.date_of_expiration);
          item.secondsLeft = (item.date_of_expiration.getTime() - new Date().getTime()) / 1000;
          item.breadcrumb_items = this.generateBreadCumbForCategory(item.category_id);
          item.sanitized_desc = this.sanitizer.bypassSecurityTrustHtml(item.description);
          item.activeIndex = 0;
          item.imageLoaded = false;
          item.auctionEnded = false;
        }
        this.auctionDataLoaded = true;
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      },
      error: (e) => {
        this.auctionDataLoaded = true;
        if(e.status === 400){
          for(var obj in e.error.validationErrors){
            this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
          }
        }
      }
    });
  }
}
