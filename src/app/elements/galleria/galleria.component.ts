import { Component, Input } from '@angular/core';
import { AuctionDataModel } from '../../models/auction.data.model';
import { GalleriaModule } from 'primeng/galleria';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-galleria',
  standalone: true,
  imports: [ GalleriaModule, SkeletonModule ],
  templateUrl: './galleria.component.html',
  styleUrl: './galleria.component.css'
})
export class GalleriaComponent {
  @Input() item!: AuctionDataModel;
  @Input() onOpenBid: () => void = () => {};
  next() {
    if(this.item.activeIndex + 1 < this.item.images.length){
      this.item.activeIndex++;
    }
  }
  prev() {
    if(this.item.activeIndex > 0){
      this.item.activeIndex--;
    }
  }
  onImageLoad(){
    this.item.imageLoaded = true;
  }
}
