import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CountdownEvent, CountdownModule } from 'ngx-countdown';
import { MenuItem, MessageService } from 'primeng/api';
import { AuctionDataModel } from '../../models/auction.data.model';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthService } from '../../services/auth.service';
import { StyleClassModule } from 'primeng/styleclass';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [CommonModule, StyleClassModule, ProgressBarModule, ReactiveFormsModule, InputNumberModule, InputGroupAddonModule, InputGroupModule, InputTextModule, ButtonModule, DialogModule, SkeletonModule, CountdownModule, BreadcrumbModule, RippleModule, MenuModule, PanelModule, DividerModule],
  templateUrl: './auction.component.html',
  styleUrl: './auction.component.css'
})
export class AuctionComponent {
  @Input() item!: AuctionDataModel;
  @ViewChild('galleryContainer', { read: ViewContainerRef }) galleryContainer!: ViewContainerRef;
  dialog_visible: boolean = false;
  galleriaLoaded: boolean = false;
  addAjax: boolean = false;
  min_bid: number = 0;
  menu_auction_items: MenuItem[] | undefined;
  form!:FormGroup;
  constructor(private _auth:AuthService, private fb: FormBuilder, private _api: ApiService, private _message: MessageService) {}
  ngOnInit(): void {
    this.menu_auction_items = [
      {
        label: 'Make bid',
        title: 'bid'
      },
    ];
    if(this.item.top_bid){
      this.min_bid = this.item.top_bid.amount + 10;
    } else {
      this.min_bid = this.item.startPrice;
    }
    this.form = this.fb.group({
      offer_amount: [0, [Validators.required, , Validators.min(this.min_bid), Validators.max(1000000000)]]
    });
  }
  async ngAfterViewInit(){
    const { GalleriaComponent } = await import('../galleria/galleria.component');
    const componentRef = this.galleryContainer.createComponent(GalleriaComponent);
    componentRef.setInput('item', this.item);
    componentRef.setInput('onOpenBid', this.openBid.bind(this));
    this.galleriaLoaded = true;
  }
  openBid(){
    if(this.item.auctionEnded){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'This auction has ended, and you can no longer place bids.' });
      return;
    }
    if(this._auth.getUsername() === this.item.username){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'You cannot place a bid on your own auction.' });
      return;
    }
    if(this.item.top_bid){
      this.min_bid = this.item.top_bid.amount + 10;
    } else {
      this.min_bid = this.item.startPrice;
    }
    this.offer_amount?.setValue(this.min_bid);
    this.dialog_visible = true;
  }
  onSubmit(){
    if(this.form.valid && !this.item.auctionEnded){
      this.addAjax = true
      this._api?.post("api/Bid/putOffer", {
        bid: {
          mail: this._auth.getUserEmail(),
          auction_id: this.item.id,
          amount: this.offer_amount?.value,
        }
      }).subscribe(
        {
          next: () => {
            this.dialog_visible = false
            this.addAjax = false
            this._message.add({ severity: 'success', summary: 'Success', detail: 'Your bid has been successfully placed.' })
          },
          error: (e) => {
            this.dialog_visible = false
            this.addAjax = false
            if(e.status === 400){
              for(var obj in e.error.validationErrors){
                this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
              }
            }
          }
        }
      )
    }
  }
  handleCountdown(e: CountdownEvent){
    if (e.action === 'done') {
      this.item.auctionEnded = true;
    }
  }
  get offer_amount() { return this.form.get('offer_amount'); }
}
