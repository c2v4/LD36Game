import IIntervalService = angular.IIntervalService;
import * as _ from "lodash";

export class Tribe implements ng.IComponentOptions {
    public controller: Function = TribeController;
    public template: string = require("./tribe-template.html");
    public controllerAs: string = "vm"
}
class TribeController {

    static $inject: Array<string> = ['$interval'];

    public tickTime = 1000;
    public resources: Resources = {
        food: 100
    };
    // public availableProfessions: Dictionary<Profession> = new Dictionary<Profession>([
    //     {key: "idle", value: {name:'idle',foodConsumption: 0.1}},
    //     // {key: "hunter", value: {foodConsumption: 0.3}}
    // ]);
    public population: Array<PopulationEntry> = [
        {
            cardinality: 16,
            profession: {
                name: 'idle', foodConsumption: 0.1, act: ()=> {
                }
            }
        },
        {
            cardinality: 0,
            profession: {
                name: 'hunter', foodConsumption: 0.3, act: ()=> {
                }
            }
        },
    ];
    public tick: Function = ()=> {
        this.feed();
    };
    public feed: Function = ()=> {
        this.resources.food -= _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.foodConsumption;
        }).sum();
    };

    constructor(public $interval: IIntervalService) {
        $interval(this.tick, this.tickTime);
    }


}
interface Resources {
    food: number
}
// interface Population {
//     idle: number;
// }
interface Profession {
    name: string,
    foodConsumption: number
    act: Function
}
interface PopulationEntry {
    cardinality: number,
    profession: Profession
}