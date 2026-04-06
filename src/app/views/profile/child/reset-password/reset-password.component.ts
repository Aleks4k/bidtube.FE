import { Component, OnInit } from '@angular/core';
import { GoBackButtonComponent } from '../../../../elements/go-back-button/go-back-button.component';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { sha512 } from 'js-sha512';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ ButtonModule, RippleModule, ProgressBarModule, DividerModule, InputTextModule, CommonModule, GoBackButtonComponent, ReactiveFormsModule, InputGroupModule, InputGroupAddonModule ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  editPasswordForm!: FormGroup;
  editAJAX = false;
  constructor(private _message: MessageService, private fb: FormBuilder, private _api: ApiService, private _auth: AuthService){}
  ngOnInit(): void {
    this.editPasswordForm = this.fb.group({
      old_password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      new_password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      new_password_repeat: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
    }, {
      validators: [ this.currentPasswordValidator(), this.passwordMatchValidator() ]
    });
  }
  currentPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const oldPassword = control.get('old_password');
      const newPassword = control.get('new_password');
      if (!oldPassword || !newPassword) {
        return null;
      }
      if (oldPassword.value === newPassword.value) {
        newPassword.setErrors({ newPasswordSameAsOld: true });
      }
      return null;
    };
  }
  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const newPassword = control.get('new_password');
      const newPasswordRepeat = control.get('new_password_repeat');
      if (!newPassword || !newPasswordRepeat) {
        return null;
      }
      const errors = newPasswordRepeat.errors || {};
      if (newPassword.value !== newPasswordRepeat.value) {
        errors['passwordsMismatch'] = true;
      } else {
        delete errors['passwordsMismatch'];
      }
      newPasswordRepeat.setErrors(Object.keys(errors).length ? errors : null);
      return null;
    };
  }
  passwordValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value: string = control.value || '';
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()\-_=+{};:,<.>]/.test(value);
    if (!hasUppercase) {
      return { 'uppercase': true };
    }
    if (!hasLowercase) {
      return { 'lowercase': true };
    }
    if (!hasNumber) {
      return { 'number': true };
    }
    if (!hasSpecial) {
      return { 'special': true };
    }
    return null;
  }
  onSubmit() {
    if (this.editPasswordForm.valid) {
      this.editAJAX = true;
      this._api?.post("api/User/updateUserPassword", {
        user: {
          mail: this._auth.getUserEmail(),
          current_password: sha512(this.old_password!.value),
          new_password: sha512(this.new_password!.value)
        }
      }).subscribe(
        {
          next: () => {
            this.editAJAX = false;
            this._message.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully.' })
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
  get old_password() { return this.editPasswordForm.get('old_password'); }
  get new_password() { return this.editPasswordForm.get('new_password'); }
  get new_password_repeat() { return this.editPasswordForm.get('new_password_repeat'); }
}
