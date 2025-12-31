import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { NgFor, NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AppComponent } from './app.component';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { RecordComponent } from './Pages/Record/record.component';
import { LandingComponent } from './Pages/Landing/landing.component';
import { AppRoutingModule } from './app-routing.module';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ManageComponent } from './Pages/Manage/manage.component';
import { MatTableModule } from '@angular/material/table';

@NgModule({ declarations: [
        AppComponent,
        RecordComponent,
        LandingComponent,
        ManageComponent
    ],
    bootstrap: [AppComponent],
    imports: [
        AppRoutingModule,
        MatCardModule, 
        MatButtonModule, 
        NgFor, 
        NgIf, 
        MatInputModule, 
        MatDatepickerModule, 
        MatFormFieldModule, 
        MatProgressSpinnerModule,
        BrowserModule,
        BrowserAnimationsModule,
        MatTableModule
    ],
    providers: [
        provideNativeDateAdapter(), 
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
