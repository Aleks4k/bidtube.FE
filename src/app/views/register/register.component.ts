import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { Router, RouterLink } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { sha512 } from 'js-sha512';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ RippleModule, ProgressBarModule, DividerModule, RouterLink, CheckboxModule, CalendarModule, ButtonModule, InputGroupAddonModule, InputGroupModule, CardModule, ReactiveFormsModule, CommonModule, FloatLabelModule, InputTextModule ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  registerAJAX = false;
  constructor(private _message: MessageService, private router:Router, private fb: FormBuilder, private _api: ApiService, private _auth: AuthService) {}
  ngOnInit(): void {
    this.registerForm = this.fb.group({
      mail: ['', [Validators.required, Validators.maxLength(255), Validators.email]],
      username: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(24), Validators.pattern('^[^@]*$')]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      date_of_birth: ['', [this.legalAgeValidator]],
      phone: ['', [Validators.maxLength(25)]],
      remember_me: [false], 
    });
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
    if (this.registerForm.valid) {
      this.registerAJAX = true;
      var date_of_birth = new Date(this.dateOfBirth?.value);
      if(date_of_birth){ //Fora ovoga je da sklonimo razliku između TIMEZONE jer kalendar od primeng ne podržava to.
        date_of_birth.setUTCMinutes(date_of_birth.getUTCMinutes() - date_of_birth.getTimezoneOffset());
      }
      this._api?.post("api/User/register", {
        user: {
          username: this.username!.value,
          password: sha512(this.password!.value),
          mail: this.mail!.value,
          date_of_birth: (this.dateOfBirth?.value) ? date_of_birth.toISOString() : null, //Proveravamo this.dateOfBirth a ne date_of_birth jer on nikad nije null pošto će biti 1970 godina ako je loš ctor.
          phone: this.phone?.value
        }
      }).subscribe(
        {
          next: (v) => {
            this.registerAJAX = false;
            this._auth.setToken(v, !this.remember_me?.value, true)
            this.router.navigate(['/home'])
          },
          error: (e) => {
            this.registerAJAX = false;
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
  get mail() { return this.registerForm.get('mail'); }
  get username() { return this.registerForm.get('username'); }
  get password() { return this.registerForm.get('password'); }
  get dateOfBirth() { return this.registerForm.get('date_of_birth'); }
  get phone() { return this.registerForm.get('phone'); }
  get remember_me() { return this.registerForm.get('remember_me') }
}
