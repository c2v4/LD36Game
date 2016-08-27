import IIntervalService = angular.IIntervalService;
export class Tribe implements ng.IComponentOptions {
    public controller: Function = TribeController;
    public template: string = require("./tribe-template.html");
    public controllerAs: string = "vm"
}
class TribeController {

    static $inject: Array<string> = ['$interval'];

    public population: number = 16;
    public tickTime = 1000;
    public availableProfessions: Array<Profession> = [
        {
            job: "idle",
            foodConsumption: 0.1
        }
    ];
    public tick: Function = ()=> {
        this.population--;
    };
    public feed: Function = ()=> {

    };
    public resources: Resources = {
        food: 100
    };

    constructor(public $interval: IIntervalService) {
        $interval(this.tick, this.tickTime);
    }


}
interface Resources {
    food: number
}
interface Population {
    idle: number;
}
interface Profession {
    job: string,
    foodConsumption: number
}