import { BirdPrediction } from "./bird-prediction"

export class PredictionListData {
    public id: string;
    public predictionData: BirdPrediction[];
    public createdDate: Date;
    public birdName: string;

    public constructor(
        id: string,
        predictionData: BirdPrediction[],
        createdDate: Date,
        birdName: string,
    ) {
        this.id = id;
        this.predictionData = predictionData;
        this.createdDate = createdDate;
        this.birdName = birdName;
    }

}