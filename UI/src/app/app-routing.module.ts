import { RecordComponent } from './Pages/Record/record.component';
import { LandingComponent } from './Pages/Landing/landing.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageComponent } from './Pages/Manage/manage.component';

const routes: Routes = [
    {path: '', component: LandingComponent},
    {path: 'record', component: RecordComponent},
    {path: 'manage', component: ManageComponent}
  ];

@NgModule({
    imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled' })],
    exports: [RouterModule]
  })
  export class AppRoutingModule { 
  
    constructor() {
      
    }
  
  }
