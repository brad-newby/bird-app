import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { BirdServiceService } from "../../Services/bird-service.service";
import { PredictionListData } from "../../Models/predictionListData";
import { DomSanitizer } from "@angular/platform-browser";
import { BirdPrediction } from "../../Models/bird-prediction";

@Component({
    selector: 'app-manage',
    templateUrl: './manage.component.html',
    styleUrl: '../../app.component.scss',
    standalone: false,
})
export class ManageComponent {

    displayedColumns: string[] = ['createdDate', 'birdName'];
    tableData: PredictionListData[] = [];
    audioURL = "";
    viewEntry = false;
    activePrediction: BirdPrediction[] = [];

    constructor(private router: Router, private _birdService: BirdServiceService, private _domSanitizer: DomSanitizer){}

    ngOnInit() {
        this._birdService.getPredictions().subscribe(result => {
            result.forEach((element: any) => {
                const newDate = new Date(element['createdDate']);
                const predictionData = JSON.parse(element['predictionData']);
                const birdName = predictionData[0].common_name
                const newEntry: PredictionListData = new PredictionListData(element['id'],predictionData,newDate,birdName);
                this.tableData = [...this.tableData, newEntry]
            });
        })
    }

    sanitize(url: string) {
        return this._domSanitizer.bypassSecurityTrustUrl(url);
    }

    onLineItemClick(row: any) {
        console.log(row);
        this.viewEntry = true;
        this.activePrediction = row['predictionData'];
        this._birdService.getPredictionAudio(row['id']).subscribe(result => {
            this.audioURL = URL.createObjectURL(result)
        });
    }

}