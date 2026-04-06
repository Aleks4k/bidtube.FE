import { Location } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-go-back-button',
  standalone: true,
  imports: [ DividerModule, RouterModule, RippleModule ],
  templateUrl: './go-back-button.component.html',
  styleUrl: './go-back-button.component.css'
})
export class GoBackButtonComponent{
  @Input() label: string = 'Undefined';
  @Input() navigateBack: boolean = false; //Ukoliko je ovo false vodimo preko routera na relativnu rutu, ako je true bukvalno koristimo location.back().
  constructor(private location: Location, private router: Router, private route: ActivatedRoute) {
  }
  performAction(){
    if(this.navigateBack){
      this.location.back();
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
