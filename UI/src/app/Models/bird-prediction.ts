export class BirdPrediction {
    public common_name: string;
    public confidence: string;
    public label: string;
    public scientific_name: string;
    public imageURL: string;
    public description: string;
    public ttsDescription: string;
    public end_time: string;
    public start_time: string;

    public constructor(
        common_name: string,
        confidence: string,
        label: string,
        scientific_name: string,
        imageURL: string,
        description: string,
        ttsDescription: string,
        end_time: string,
        start_time: string,
    ) {
        this.common_name = common_name;
        this.confidence = confidence;
        this.label = label;
        this.scientific_name = scientific_name;
        this.imageURL = imageURL;
        this.description = description;
        this.ttsDescription = ttsDescription;
        this.end_time = end_time;
        this.start_time = start_time;
    }

    public createEmpty(): BirdPrediction {
        return new BirdPrediction("","","","","","","","","");
    }
}
