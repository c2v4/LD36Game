import IIntervalService = angular.IIntervalService;
import * as _ from "lodash";

export class Tribe implements ng.IComponentOptions {
    public controller: Function = TribeController;
    public template: string = require("./tribe-template.html");
    public controllerAs: string = "vm"
}
class TribeController {

    static $inject: Array<string> = ['$interval', '$mdDialog'];

    constructor(public $interval: IIntervalService, public $mdDialog: angular.material.IDialogService) {
        $interval(this.tick, 1000 / this.tickFrequency);
        this.updateStep();
    }

    public controller: TribeController = this;
    public step: number = 1;
    public tickFrequency = 4;

    public availableSteps: Array<number> = [];

    public resources: Resources = {
        Science: {
            name: "Science",
            quantity: 0,
            balance: ()=> {
                return this.population['Scientist'].cardinality * this.population['Idle'].profession.efficiency;
            }
        },
        Children: {
            name: "Children",
            quantity: 0,
            balance: ()=> {
                return this.population['Idle'].cardinality * this.population['Idle'].profession.efficiency;
            }
        },
        Food: {
            name: "Food",
            quantity: 10,
            balance: ()=> {
                return _(['Hunter', 'Gatherer', 'Fisher', 'Farmer']).map((worker)=> {
                        return this.population[worker] ? (this.population[worker].cardinality * this.population[worker].profession.efficiency) : 0;
                    }).sum() - this.getTotalFoodConsumed()
            }
        }
    };
    public environment: Environment = {
        "Berries": {
            name: "Berries",
            quantity: 120,
            balance: ()=> {
                return this.environment["Berries"].renewal() - this.population['Gatherer'].cardinality * this.population['Gatherer'].profession.efficiency;
            },
            renewal: ()=> {
                return (3 / (Math.pow((this.environment["Berries"].quantity - 120) / 10, 2) + 1));
            },
            act: ()=> {
                this.environment["Berries"].quantity += this.environment["Berries"].renewal() / this.tickFrequency;
            }
        }
    };
    public availableTechs: TechTree = {
        "Hunting": {
            name: 'Hunting',
            price: 2,
            researched: ()=> {
                this.population["Hunter"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Hunter',
                        FoodConsumption: 0.3,
                        efficiency: 0.5,
                        upgradeCost: 1,
                        act: (efficiency)=> {
                            if (this.environment["Animals"].quantity - efficiency > 0) {
                                this.resources["Food"].quantity += efficiency;
                                this.environment["Animals"].quantity -= efficiency;
                            } else {
                                this.resources["Food"].quantity += this.environment["Animals"].quantity;
                                this.environment["Animals"].quantity = 0;
                            }
                        }
                    }
                };
                this.environment["Animals"] =
                {
                    name: "Animals",
                    quantity: 80,
                    renewal: ()=> {
                        return (6 / (Math.pow((this.environment["Animals"].quantity - 120) / 10, 2) + 1));
                    },
                    balance: ()=> {
                        return this.environment["Animals"].renewal() - this.population['Hunter'].cardinality * this.population['Hunter'].profession.efficiency;
                    },
                    act: ()=> {
                        this.environment["Animals"].quantity += this.environment["Animals"].renewal() / this.tickFrequency;
                    }

                }

            },
            unlocks: ['Animal Husbandry', 'Archery'],
            prerequisites: []
        },
        "Crafting": {
            name: 'Crafting',
            price: 4,
            researched: ()=> {
                this.resources['tools'] = {
                    name: 'tools',
                    quantity: 0,
                    balance: ()=> {
                        if (this.population['Crafter']) {
                            return this.population['Crafter'].cardinality * this.population['Crafter'].profession.efficiency;
                        }
                    }
                };
                this.population["Crafter"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Crafter',
                        FoodConsumption: 0.5,
                        efficiency: 0.01,
                        upgradeCost: 8,
                        act: (efficiency)=> {
                            this.resources['tools'].quantity += efficiency;
                        }
                    }
                };
            },
            unlocks: ['Agriculture'],
            prerequisites: []
        },
        "Settlement": {
            name: 'Settlement',
            price: 3,
            researched: ()=> {

            },
            unlocks: ['Agriculture'],
            prerequisites: []
        },
        "Alphabet": {
            name: 'Alphabet',
            price: 2,
            researched: ()=> {

            },
            unlocks: ['Writing'],
            prerequisites: []
        },
        "Fishing": {
            name: 'Fishing',
            price: 2,
            researched: ()=> {
                this.population["Fisher"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Fisher',
                        FoodConsumption: 0.3,
                        efficiency: 0.5,
                        upgradeCost: 1,
                        act: (efficiency)=> {
                            if (this.environment["Fish"].quantity - efficiency > 0) {
                                this.resources["Food"].quantity += efficiency;
                                this.environment["Fish"].quantity -= efficiency;
                            } else {
                                this.resources["Food"].quantity += this.environment["Fish"].quantity;
                                this.environment["Fish"].quantity = 0;
                            }
                        }
                    }
                };
                this.environment["Fish"] =
                {
                    name: "Fish",
                    quantity: 80,
                    renewal: ()=> {
                        return (6 / (Math.pow((this.environment["Fish"].quantity - 120) / 10, 2) + 1));
                    },
                    balance: ()=> {
                        return this.environment["Fish"].renewal() - this.population['Fisher'].cardinality * this.population['Fisher'].profession.efficiency;
                    },
                    act: ()=> {
                        this.environment["Fish"].quantity += this.environment["Fish"].renewal() / this.tickFrequency;
                    }

                }

            },
            unlocks: ['Sailing'],
            prerequisites: []
        }
    };
    public population: Population = {
        Idle: {
            cardinality: 1,
            profession: {
                name: 'Idle',
                FoodConsumption: 0.1,
                efficiency: 0.01,
                upgradeCost: 3,
                act: (efficiency: number, controller: TribeController)=> {
                    controller.resources["Children"].quantity += efficiency;
                    var toAdd = Math.floor(controller.resources["Children"].quantity);
                    if (toAdd > 0) {
                        controller.resources["Children"].quantity -= toAdd;
                        _(controller.population).filter((item: PopulationEntry)=> {
                            return item.profession.name == "Idle";
                        }).forEach((item: PopulationEntry)=> {
                            item.cardinality += toAdd;
                        });
                        this.updateStep();
                    }

                }
            }
        },
        Scientist: {
            cardinality: 0,
            profession: {
                name: 'Scientist',
                FoodConsumption: 0.4,
                efficiency: 0.01,
                upgradeCost: 6,
                act: (efficiency: number, controller: TribeController)=> {
                    controller.resources["Science"].quantity += efficiency;
                }
            }
        },
        Gatherer: {
            cardinality: 2,
            profession: {
                name: 'Gatherer',
                FoodConsumption: 0.2,
                efficiency: 0.3,
                upgradeCost: 1,
                act: (efficiency)=> {
                    if (this.environment["Berries"].quantity - efficiency > 0) {
                        this.resources["Food"].quantity += efficiency;
                        this.environment["Berries"].quantity -= efficiency;
                    } else {
                        this.resources["Food"].quantity += this.environment["Berries"].quantity;
                        this.environment["Berries"].quantity = 0;
                    }
                }
            }
        }
    };

    public allTechs: TechTree = {
        "Agriculture": {
            name: 'Agriculture',
            price: 10,
            researched: ()=> {
                this.population["Farmer"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Farmer',
                        FoodConsumption: 0.2,
                        efficiency: 0.25,
                        upgradeCost: 5,
                        act: (efficiency)=> {
                            this.resources["Food"].quantity += efficiency;
                        }
                    }
                };
            },
            unlocks: ['Animal Husbandry', 'Archery', 'Mining', 'Pottery'],
            prerequisites: ['Crafting', 'Settlement']
        },
        "Mining": {
            name: 'Mining',
            price: 15,
            researched: ()=> {
                this.resources['Ore'] = {
                    name: 'Ore',
                    quantity: 0,
                    balance: ()=> {
                        if (this.population['Miner']) {
                            return this.population['Miner'].cardinality * this.population['Miner'].profession.efficiency;
                        }
                    }
                };
                this.population["Miner"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Miner',
                        FoodConsumption: 0.6,
                        efficiency: 0.2,
                        upgradeCost: 5,
                        act: (efficiency)=> {
                            this.resources["Ore"].quantity += efficiency;
                        }
                    }
                };
            },
            unlocks: ['Bronze Working', 'Masonry'],
            prerequisites: ['Crafting', 'Settlement']
        },
    };


    public availableWorkers(): boolean {
        return _(this.population).filter((item: PopulationEntry)=> {
                return item.profession.name == "Idle";
            }).map((item: PopulationEntry)=> {
                return item.cardinality
            }).sum() > 0;
    }

    public tick: Function = ()=> {
        this.starve();
        this.feed();
        this.work();
        this.updateEnvironment();
    };

    public feed: Function = ()=> {
        this.resources["Food"].quantity -= _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.FoodConsumption / this.tickFrequency;
        }).sum();
    };

    private work() {
        _(_.keys(this.population)).map((key)=> {
            return this.population[key]
        }).forEach((entry: PopulationEntry)=> {
            entry.profession.act(entry.profession.efficiency / this.tickFrequency * entry.cardinality, this.controller);
        })
    }

    public addWorker(worker: PopulationEntry): void {
        let diff = (this.population['Idle'].cardinality < this.step) ? this.population['Idle'].cardinality : +this.step;
        this.population['Idle'].cardinality -= diff;
        worker.cardinality += diff;
    }

    public removeWorker(worker: PopulationEntry): void {
        let diff = worker.cardinality < this.step ? worker.cardinality : +this.step;
        this.population['Idle'].cardinality += diff;
        worker.cardinality -= diff;
    }

    private starve() {
        let totalFoodConsumption = this.getTotalFoodConsumed();
        while (totalFoodConsumption > this.resources["Food"].quantity) {
            let numOfIdlers = this.population['Idle'].cardinality;
            let index: number = Math.floor(Math.random() * _.keys(this.population).length);
            let populationEntry: PopulationEntry = numOfIdlers > 0 ? this.population['Idle'] : this.population[_.keys(this.population)[index]];
            if (populationEntry.cardinality > 0) {
                totalFoodConsumption -= populationEntry.profession.FoodConsumption;
                populationEntry.cardinality--;
            }
            this.updateStep();
        }
    }

    public getTotalPopulation() {
        return _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality;
        }).sum();
    }

    public getTotalFoodConsumed() {
        return _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.FoodConsumption;
        }).sum();
    }

    public research(tech: Tech) {
        this.resources["Science"].quantity -= tech.price;
        delete this.availableTechs[tech.name];
        this.allTechs[tech.name] || delete this.allTechs[tech.name];
        _(tech.unlocks).forEach((newTech: string)=> {
            if (this.allTechs[newTech] && !_(this.allTechs[newTech].prerequisites).some((prerequisite: string)=> {
                    return this.allTechs[prerequisite] || this.availableTechs[prerequisite];
                })) {
                this.availableTechs[newTech] = this.allTechs[newTech];
                delete this.allTechs[newTech];
            }
        });
        tech.researched();
    }

    private updateEnvironment() {
        _(this.environment).forEach((value: EnvironmentItem)=> {
            value.act();
        });
    }

    public upgrade(profession: Profession) {
        this.resources["tools"].quantity -= profession.upgradeCost;
        profession.efficiency *= 1.2;
        profession.upgradeCost *= 1.6;
    }

    public updateStep(): void {
        let toReturn: Array<number> = [];
        [0.1, 0.2, 0.5, 1].forEach((item)=> {
            let number = Math.floor(this.getTotalPopulation() * item);
            if (number > 1) {
                toReturn.push(number)
            }
        });
        this.availableSteps = toReturn;
        if (this.availableSteps.length == 0) {
            this.step = 1;
        }
        if (this.step != 1) {
            this.step = _(this.availableSteps.concat(1)).minBy((item)=> {
                return Math.abs(this.step - item);
            })
        }
    }
}
interface Resources {
    [key: string]: Resource;
}
interface Resource {
    name: string
    quantity: number
    balance: Function
}

interface Profession {
    name: string
    FoodConsumption: number
    efficiency: number
    act: Function
    upgradeCost: number
}
interface Population {
    [key: string]: PopulationEntry;
}
interface PopulationEntry {
    cardinality: number
    profession: Profession
}

interface Tech {
    name: string
    price: number
    researched: Function
    unlocks: Array<string>
    prerequisites: Array<string>
}
interface TechTree {
    [key: string]: Tech;
}

interface Environment {
    [key: string]: EnvironmentItem;
}
interface EnvironmentItem {
    name: string
    quantity: number
    act: Function
    balance: Function
    renewal: Function
}