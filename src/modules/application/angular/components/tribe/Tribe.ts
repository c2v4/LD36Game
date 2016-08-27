import IIntervalService = angular.IIntervalService;
import * as _ from "lodash";

export class Tribe implements ng.IComponentOptions {
    public controller: Function = TribeController;
    public template: string = require("./tribe-template.html");
    public controllerAs: string = "vm"
}
class TribeController {

    static $inject: Array<string> = ['$interval'];

    constructor(public $interval: IIntervalService) {
        $interval(this.tick, this.tickTime);
    }

    public controller: TribeController = this;
    public tickTime = 1000;
    public resources: Resources = {
        science: 0,
        children: 0,
        food: 100
    };
    public availableTechs: Array<Tech> = [{
        name: 'hunting',
        price: 1,
        researched: ()=> {
            this.population.push({
                cardinality: 0,
                profession: {
                    name: 'hunter',
                    foodConsumption: 0.3,
                    efficiency: 0.5,
                    act: (efficiency)=> {
                        this.resources.food += efficiency;

                    }
                }
            });
        }
    }];

    public population: Array<PopulationEntry> = [
        {
            cardinality: 16,
            profession: {
                name: 'idle',
                foodConsumption: 0.1,
                efficiency: 0.01,
                act: (efficiency: number, controller: TribeController)=> {
                    controller.resources.children += efficiency;
                    var toAdd = Math.ceil(controller.resources.children);
                    if (toAdd > 0) {
                        controller.resources.children -= toAdd;
                        _(controller.population).filter((item: PopulationEntry)=> {
                            return item.profession.name == "idle";
                        }).forEach((item: PopulationEntry)=> {
                            item.cardinality += toAdd;
                        });
                    }

                }
            }
        }, {
            cardinality: 0,
            profession: {
                name: 'scientist',
                foodConsumption: 0.4,
                efficiency: 0.01,
                act: (efficiency: number, controller: TribeController)=> {
                    controller.resources.science += efficiency;
                }
            }
        }
    ];

    public availableWorkers(): boolean {
        return _(this.population).filter((item: PopulationEntry)=> {
                return item.profession.name == "idle";
            }).map((item: PopulationEntry)=> {
                return item.cardinality
            }).value() > 0;
    }

    public tick: Function = ()=> {
        this.feed();
        this.work();
        this.starve();
    };
    public feed: Function = ()=> {
        this.resources.food -= _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.foodConsumption;
        }).sum();
    };


    private work() {
        this.population.forEach((entry: PopulationEntry)=> {
            entry.profession.act(entry.profession.efficiency * entry.cardinality, this.controller);
        })
    }

    public addWorker(worker: PopulationEntry): void {
        _(this.population).filter((item: PopulationEntry)=> {
            return item.profession.name == "idle";
        }).forEach((item: PopulationEntry)=> {
            item.cardinality--
        });
        worker.cardinality++;
    }

    public removeWorker(worker: PopulationEntry): void {
        _(this.population).filter((item: PopulationEntry)=> {
            return item.profession.name == "idle";
        }).forEach((item: PopulationEntry)=> {
            item.cardinality++
        });
        worker.cardinality--;
    }

    private starve() {
        let totalFoodConsumption = _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.foodConsumption;
        }).sum();
        while (totalFoodConsumption > this.resources.food) {
            let numOfIdlers = this.population[0].cardinality;
            let index: number = Math.floor(Math.random() * this.population.length);
            let populationEntry: PopulationEntry = numOfIdlers > 0 ? this.population[0] : this.population[index];
            if (populationEntry.cardinality > 0) {
                totalFoodConsumption -= populationEntry.profession.foodConsumption;
                populationEntry.cardinality--;
            }
        }
    }

    public research(tech: Tech) {
        this.resources.science -= tech.price;
        tech.researched();
        let i = this.availableTechs.indexOf(tech);
        if (i != -1) {
            this.availableTechs.splice(i, 1);
        }
    }
}
interface Resources {
    food: number
    children: number
    science: number
}

interface Profession {
    name: string
    foodConsumption: number
    efficiency: number
    act: Function
}

interface PopulationEntry {
    cardinality: number
    profession: Profession
}

interface Tech {
    name: string
    price: number
    researched: Function
}