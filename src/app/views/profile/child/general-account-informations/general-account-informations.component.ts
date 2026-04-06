import { Component, OnInit } from '@angular/core';
import { GoBackButtonComponent } from '../../../../elements/go-back-button/go-back-button.component';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessagePrivacyType } from '../../../../models/user.message.privacy.data.model';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import { MessageService } from 'primeng/api';
import { UserEditDataModel } from '../../../../models/user.edit.data.model';

@Component({
  selector: 'app-general-account-informations',
  standalone: true,
  imports: [ SkeletonModule, TooltipModule, BadgeModule, DropdownModule, CalendarModule, CommonModule, DividerModule, RippleModule, ButtonModule, ProgressBarModule, ReactiveFormsModule, InputTextModule, GoBackButtonComponent, InputGroupModule, InputGroupAddonModule, FloatLabelModule ],
  templateUrl: './general-account-informations.component.html',
  styleUrl: './general-account-informations.component.css'
})
export class GeneralAccountInformationsComponent implements OnInit {
  editForm!: FormGroup;
  msg_options: MessagePrivacyType[] | undefined;
  editAJAX = false;
  loadingUserData = true;
  constructor(private _message: MessageService,private fb: FormBuilder, private _api: ApiService, private _auth: AuthService){}
  ngOnInit(): void {
    this.msg_options = [
      {db_code:false, text: 'Auction winners'},
      {db_code:true, text: 'Anyone'},
    ]
    this.editForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(24), Validators.pattern('^[^@]*$')]],
      date_of_birth: ['', [this.legalAgeValidator]],
      phone: ['', [Validators.maxLength(25)]],
      selectedMsgOption: ['', [Validators.required]],
    });
    this._api.post("api/User/getUserEditData", {
      user: {
        mail: this._auth.getUserEmail()
      }
    }).subscribe({
      next: (v: UserEditDataModel) => {
        this.loadingUserData = false;
        this.username?.setValue(v.username);
        if(v.date_of_birth){
          this.dateOfBirth?.setValue(new Date(v.date_of_birth));
        }
        this.phone?.setValue(v.phone);
        this.selectedMsgOption?.setValue(this.msg_options!.find(option => option.db_code === v.msg_allowed_from_anyone))
      },
      error: (e) => {
        if(e.status === 400){
          for(var obj in e.error.validationErrors){
            this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
          }
        }
      }
    })
  }
  legalAgeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const dob = new Date(control.value);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < 16) {
      return { 'underage': true };
    }
    return null;
  }
  onSubmit() {
    if (this.editForm.valid) {
      this.editAJAX = true;
      var date_of_birth = new Date(this.dateOfBirth?.value);
      if(date_of_birth){ //Fora ovoga je da sklonimo razliku između TIMEZONE jer kalendar od primeng ne podržava to.
        date_of_birth.setUTCMinutes(date_of_birth.getUTCMinutes() - date_of_birth.getTimezoneOffset());
      }
      this._api?.post("api/User/updateUserData", {
        user: {
          mail: this._auth.getUserEmail(),
          username: this.username!.value,
          date_of_birth: (this.dateOfBirth?.value) ? date_of_birth.toISOString() : null, //Proveravamo this.dateOfBirth a ne date_of_birth jer on nikad nije null pošto će biti 1970 godina ako je loš ctor.
          phone: this.phone?.value,
          msg_allowed_from_anyone: this.selectedMsgOption!.value.db_code
        }
      }).subscribe(
        {
          next: (v) => {
            this.editAJAX = false;
            this._auth.setUsername(this.username!.value);
            this._message.add({ severity: 'success', summary: 'Success', detail: 'The changes have been successfully saved in the database.' })
          },
          error: (e) => {
            this.editAJAX = false;
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
  get username() { return this.editForm.get('username'); }
  get dateOfBirth() { return this.editForm.get('date_of_birth'); }
  get phone() { return this.editForm.get('phone'); }
  get selectedMsgOption() { return this.editForm.get('selectedMsgOption'); }
}
