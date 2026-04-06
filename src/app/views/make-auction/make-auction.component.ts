import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { TreeSelectModule } from 'primeng/treeselect';;
import { MessageService, TreeNode } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { CategoryPostAuctionModel } from '../../models/category.post.auction.model';
import { EditorModule, EditorTextChangeEvent } from 'primeng/editor';
import { QuillService } from '../../services/quill.service';
import { SkeletonModule } from 'primeng/skeleton';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { ImageCropperComponent, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { CommonModule } from '@angular/common';
import { FileExtended } from '../../models/file.extension';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SliderChangeEvent, SliderModule } from 'primeng/slider';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-make-auction',
  standalone: true,
  imports: [ RippleModule, SliderModule, TreeSelectModule, ReactiveFormsModule, ImageModule, DialogModule, CommonModule, FileUploadModule, ImageCropperComponent, CalendarModule, InputNumberModule, SkeletonModule, EditorModule, InputGroupModule, InputGroupAddonModule, InputTextModule, DividerModule ],
  templateUrl: './make-auction.component.html',
  styleUrl: './make-auction.component.css',
})
export class MakeAuctionComponent implements OnInit {
  textBoxValue: string = '';
  addAjax: boolean = false;
  addPhotoForm!: FormGroup;
  addForm!:FormGroup;
  categories!: TreeNode[];
  image_List: FileExtended[] = [];
  minStartDate!: Date;
  maxStartDate!: Date;
  imageUrl: string | undefined = undefined;
  croppedImage: Blob | undefined;
  dialogVisible: boolean = false;
  transform: ImageTransform = {};
  rotation: number = 0;
  constructor(private _auth:AuthService, private cdr: ChangeDetectorRef, private router: Router, private fb: FormBuilder, private _message: MessageService, private _api:ApiService, public _quill:QuillService) { 
  }
  ngOnInit(): void {
    this.minStartDate = new Date();
    this.minStartDate.setDate(this.minStartDate.getDate() + 1)
    this.maxStartDate = new Date(this.minStartDate);
    this.maxStartDate.setFullYear(this.maxStartDate.getFullYear() + 1)
    this._quill.loadQuill()
    this.addForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
      selectedCategory: ['', [Validators.required]],
      description: [''], //On nema validatore njegovi validatori su na textValidator zbog problema sa primeng i quill.
      starting_price: ['', [Validators.required, Validators.min(0.50), Validators.max(1000000000)]],
      date_of_exp: ['', [Validators.required, this.atleastOneDay.bind(this), this.maxOneYear.bind(this)]], //BIND se koristi samo ako ćemo u okviru validator funkcije pozivati this. referencu da se angular ne pogubi.
    });
    this.description?.setValidators(this.textValidator());
    this.addPhotoForm = this.fb.group({
      alt_text: ['', [Validators.required, Validators.maxLength(96)]],
      zoom_value: [1]
    });
    this._api.get("api/Category/getCategories"
    ).subscribe({
      next: (v: CategoryPostAuctionModel) => {
        this.categories = v.categories;
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
  updateMinMaxDate(){
    this.minStartDate = new Date();
    this.minStartDate.setDate(this.minStartDate.getDate() + 1)
    this.maxStartDate = new Date(this.minStartDate);
    this.maxStartDate.setFullYear(this.maxStartDate.getFullYear() + 1)
  }
  maxOneYear(control: AbstractControl): { [key: string]: boolean } | null {
    const dob = new Date(control.value);
    if (dob > this.maxStartDate) {
      return { 'tobig': true };
    }
    return null;
  }
  atleastOneDay(control: AbstractControl): { [key: string]: boolean } | null {
    const dob = new Date(control.value);
    if (dob < this.minStartDate) {
      return { 'tosmall': true };
    }
    return null;
  }
  onSelect(event: any, fileUpload: FileUpload):void
  {
    if(event.files.length > 1){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'You can\'t select more than 1 file at once.' });
      fileUpload.clear();
      return;
    }
    if(this.image_List.length >= 9){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'You can\'t upload more than 9 photos.' });
      fileUpload.clear();
      return;
    }
    let tempUrl: string = event.files[0].objectURL.changingThisBreaksApplicationSecurity
    let tempName: string = event.files[0].name
    if(this.image_List.map(x => x.file.name).includes(tempName)){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'You can\'t use same file twice.' });
      fileUpload.clear();
      return;
    }
    this.imageUrl = tempUrl
    this.alt_text?.setValue(tempName);
    this.transform = {};
    this.zoom_value?.setValue(1);
    this.dialogVisible = true;
    fileUpload.clear();
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob!;
  }
  loadImageFailed() {
    this._message.add({ severity: 'error', summary: 'Error', detail: 'File type is not supported.' });
    this.dialogVisible = false;
  }
  blobToFile(blob: Blob, fileName:string): File {
    return new File([blob], fileName) as File;
  }
  submitAddPhotoForm(){
    if (this.addPhotoForm.valid) {
      let tmpFile: File = this.blobToFile(this.croppedImage!, this.alt_text!.value);
      let tmpUrl: string = this.getImageUrl(tmpFile);
      let fileExtended: FileExtended = {
        file: tmpFile,
        imageUrl: tmpUrl
      };
      this.image_List.push(fileExtended);
      this.dialogVisible = false;
    }
  }
  getImageUrl(file: File): string {
    let url: string = URL.createObjectURL(file)
    return url;
  }
  deleteFile(name: string): void{
    const index = this.image_List.findIndex(image => image.file.name === name);
    if (index !== -1) {
        this.image_List.splice(index, 1);
    }
  }
  onSubmit(){
    if(this.addForm.valid && this.image_List.length > 0){
      this.addAjax = true;
      const imageLinks: string[] = [];
      const imageNames: string[] = [];
      this.image_List.forEach((fileExtended) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileExtended.file);
        reader.onload = () => {
          imageLinks.push(reader.result as string);
          imageNames.push(fileExtended.file.name);
        };
      });
      this._api?.post("api/Auction/addAuction", {
        auction: {
          mail: this._auth.getUserEmail(),
          title: this.title?.value,
          category_id: this.selectedCategory?.value.key,
          description: this.description?.value,
          starting_price: this.starting_price?.value,
          date_of_exp: new Date(this.date_of_exp?.value), //Namerno šaljemo ovako da bi dobili 0 časovnu zonu na serveru.
          images: imageLinks,
          image_names: imageNames
        }
      }).subscribe(
        {
          next: (v) => {
            this.addAjax = false;
            this._message.add({ severity: 'success', summary: 'Success', detail: 'Auction successfully added.' })
            this.router.navigate(['/home'])
          },
          error: (e) => {
            this.addAjax = false;
            if(e.status === 400){
              for(var obj in e.error.validationErrors){
                this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
              }
            }
            if(e.status === 503){
              this._message.add({ severity: 'error', summary: 'Error', detail: e.error.title });
            }
          }
        }
      )
    }
  }
  validateText(event: EditorTextChangeEvent): void {
    this.textBoxValue = event.textValue;
    this.cdr.detectChanges();
  }
  textValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (this.textBoxValue.length == 0) {
        document.querySelector('.cst-texteditor')?.classList.add('ng-invalid', 'ng-dirty', 'border-red-500')
        return { required: true };
      }
      if (this.textBoxValue.length < 24) {
        document.querySelector('.cst-texteditor')?.classList.add('ng-invalid', 'ng-dirty', 'border-red-500')
        return { minlength: true };
      }
      if (this.textBoxValue.length > 1024) {
        document.querySelector('.cst-texteditor')?.classList.add('ng-invalid', 'ng-dirty', 'border-red-500')
        return { maxlength: true };
      }
      document.querySelector('.cst-texteditor')?.classList.remove('ng-invalid', 'ng-dirty', 'border-red-500')
      return null;
    };
  }
  updateImageZoom(event: SliderChangeEvent){
    this.transform = {
      ...this.transform,
      scale: this.zoom_value?.value,
    };
  }
  updateRotation(num: number){
    this.rotation = this.rotation + num;
    this.transform = {
      ...this.transform,
      rotate: this.rotation,
    };
  }
  get alt_text() { return this.addPhotoForm.get('alt_text'); }
  get zoom_value() { return this.addPhotoForm.get('zoom_value'); }
  get title() { return this.addForm.get('title'); }
  get selectedCategory() { return this.addForm.get('selectedCategory'); }
  get description() { return this.addForm.get('description'); }
  get starting_price() { return this.addForm.get('starting_price'); }
  get date_of_exp() { return this.addForm.get('date_of_exp'); }
}
