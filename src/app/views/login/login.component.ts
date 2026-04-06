import { AfterViewInit, Component, OnInit } from '@angular/core';
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
import { Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';
import { Router, RouterLink } from '@angular/router';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { sha512 } from 'js-sha512';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormControl } from '@angular/forms';
import { RippleModule } from 'primeng/ripple';


declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RippleModule, ReactiveFormsModule, CommonModule, FloatLabelModule, InputGroupModule, InputGroupAddonModule, ProgressBarModule, CardModule, RouterLink, InputTextModule, ButtonModule, CheckboxModule, DividerModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit {
  credentialControl!: FormControl;
  loginForm!: FormGroup;
  credential:string = '';
  loginAJAX = false;
  constructor(private fb: FormBuilder, private _message: MessageService, private router:Router, private _auth:AuthService, private _api:ApiService, private renderer2: Renderer2, @Inject(DOCUMENT) private _document:any){}
  ngAfterViewInit(): void {
    if(!this.isScriptLoaded('https://accounts.google.com/gsi/client')){
      var s = this.renderer2.createElement('script');
      s.type = 'text/javascript';
      s.text = `
        function validateToken(response){document.getElementById("credential").value=response.credential;document.getElementById("credential").dispatchEvent(new Event('change'));}
      `;
      this.renderer2.appendChild(this._document.body, s);
      s = this.renderer2.createElement('script');
      s.type = 'text/javascript';
      s.src = 'https://accounts.google.com/gsi/client';
      this.renderer2.appendChild(this._document.body, s);
    } else {
      //Moramo opet da renderujemo drugme.
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          type: 'standard',
          size: 'large',
          width: '350',
          theme: 'filled_blue',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button-sm'),
        {
          type: 'icon',
          theme: 'filled_blue',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
    }
  }
  ngOnInit(): void {
    this.credentialControl = new FormControl('');
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.maxLength(255), Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      remember_me: [false], 
    });
  }
  isScriptLoaded(src: string): boolean
  {
      return Boolean(document.querySelector('script[src="' + src + '"]'));
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
  onLoginGoogle(){
    this.loginAJAX = true;
    this.credential = (<HTMLInputElement>document.getElementById("credential")).value;
    this._api?.post("api/User/login-google", {user: {token: this.credential}}).subscribe(
      {
        next: (v) => {
          this.loginAJAX = false;
          this._auth.setToken(v, false, true)
          this.router.navigate(['/home'])
        },
        error: (e) => {
          this.loginAJAX = false;
          if(e.status === 400){
            for(var obj in e.error.validationErrors){
              this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
            }
          }
        }
      }
    )
  }
  onSubmit() {
    if (this.loginForm.valid) {
      this.loginAJAX = true;
      this._api?.post("api/User/login", {
        user: {
          mail: this.mail!.value,
          password: sha512(this.password!.value),
        }
      }).subscribe(
        {
          next: (v) => {
            this.loginAJAX = false;
            this._auth.setToken(v, !this.remember_me?.value, true)
            this.router.navigate(['/home'])
          },
          error: (e) => {
            this.loginAJAX = false;
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
  toggleGoogleSignIn(){
    let googleSignInButton = document.getElementById('google-signin-button');
    if (googleSignInButton) {
        googleSignInButton.click();
    }
  }
  get mail() { return this.loginForm.get('mail'); }
  get password() { return this.loginForm.get('password'); }
  get remember_me() { return this.loginForm.get('remember_me') }
}
