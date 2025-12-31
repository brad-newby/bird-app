import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { BirdServiceService } from "../../Services/bird-service.service";



@Component({
    selector: 'app-landing',
    templateUrl: './landing.component.html',
    styleUrl: '../../app.component.scss',
    standalone: false,
})
export class LandingComponent {

    constructor(private router: Router, private _birdService: BirdServiceService){}

    ngOnInit() {
        console.log("Running health check...")
        this._birdService.healthCheck().subscribe(result => {
          console.log(result);
        })
    }

    onButtonClick(route: string) {
        this.router.navigateByUrl(route);
    }
}