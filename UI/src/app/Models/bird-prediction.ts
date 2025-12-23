export class BirdPrediction {
    public common_name: string;
    public confidence: number;
    public label: string;
    public scientific_name: string;
    public imageURL: string;
    public description: string;
    public ttsDescription: string;

    public constructor(
        common_name: string,
        confidence: number,
        label: string,
        scientific_name: string,
        imageURL: string,
        description: string,
        ttsDescription: string,
    ) {
        this.common_name = common_name;
        this.confidence = confidence;
        this.label = label;
        this.scientific_name = scientific_name;
        this.imageURL = imageURL
        this.description = description
        this.ttsDescription = ttsDescription
    }

    public createEmpty(): BirdPrediction {
        return new BirdPrediction("",0,"","","","","");
    }
}
