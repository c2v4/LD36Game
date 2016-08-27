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
        $interval(this.tick, 1000 / this.tickFrequency);
    }

    public controller: TribeController = this;

    public tickFrequency = 4;
    public resources: Resources = {
        science: {
            name: "science",
            quantity: 0,
            balance: ()=> {
                return this.population['scientist'].cardinality * this.population['idle'].profession.efficiency;
            }
        },
        children: {
            name: "children",
            quantity: 0,
            balance: ()=> {
                return this.population['idle'].cardinality * this.population['idle'].profession.efficiency;
            }
        },
        food: {
            name: "food",
            quantity: 10,
            balance: ()=> {
                return _(['hunter', 'gatherer', 'fisher', 'farmer']).map((worker)=> {
                        return this.population[worker] ? (this.population[worker].cardinality * this.population[worker].profession.efficiency) : 0;
                    }).sum() - this.getTotalFoodConsumed()
            }
        }
    };
    public environment: Environment = {
        "berries": {
            name: "berries",
            quantity: 120,
            balance: ()=> {
                return this.environment["berries"].renewal() - this.population['gatherer'].cardinality * this.population['gatherer'].profession.efficiency;
            },
            renewal: ()=> {
                return (3 / (Math.pow((this.environment["berries"].quantity - 120) / 10, 2) + 1));
            },
            act: ()=> {
                this.environment["berries"].quantity += this.environment["berries"].renewal() / this.tickFrequency;
            }
        }
    };
    public availableTechs: TechTree = {
        "Hunting": {
            name: 'Hunting',
            price: 2,
            researched: ()=> {
                this.population["hunter"] = {
                    cardinality: 0,
                    profession: {
                        name: 'hunter',
                        foodConsumption: 0.3,
                        efficiency: 0.5,
                        upgradeCost: 1,
                        act: (efficiency)=> {
                            if (this.environment["animals"].quantity - efficiency > 0) {
                                this.resources["food"].quantity += efficiency;
                                this.environment["animals"].quantity -= efficiency;
                            } else {
                                this.resources["food"].quantity += this.environment["animals"].quantity;
                                this.environment["animals"].quantity = 0;
                            }
                        }
                    }
                };
                this.environment["animals"] =
                {
                    name: "animals",
                    quantity: 80,
                    renewal: ()=> {
                        return (8 / (Math.pow((this.environment["animals"].quantity - 120) / 10, 2) + 1));
                    },
                    balance: ()=> {
                        return this.environment["animals"].renewal() - this.population['hunter'].cardinality * this.population['hunter'].profession.efficiency;
                    },
                    act: ()=> {
                        this.environment["animals"].quantity += this.environment["animals"].renewal() / this.tickFrequency;
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
                        if (this.population['crafter']) {
                            return this.population['crafter'].cardinality * this.population['crafter'].profession.efficiency;
                        }
                    }
                };
                this.population["crafter"] = {
                    cardinality: 0,
                    profession: {
                        name: 'crafter',
                        foodConsumption: 0.5,
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
                this.population["fisher"] = {
                    cardinality: 0,
                    profession: {
                        name: 'fisher',
                        foodConsumption: 0.3,
                        efficiency: 0.5,
                        upgradeCost: 1,
                        act: (efficiency)=> {
                            if (this.environment["fish"].quantity - efficiency > 0) {
                                this.resources["food"].quantity += efficiency;
                                this.environment["fish"].quantity -= efficiency;
                            } else {
                                this.resources["food"].quantity += this.environment["fish"].quantity;
                                this.environment["fish"].quantity = 0;
                            }
                        }
                    }
                };
                this.environment["fish"] =
                {
                    name: "fish",
                    quantity: 80,
                    renewal: ()=> {
                        return (8 / (Math.pow((this.environment["fish"].quantity - 120) / 10, 2) + 1));
                    },
                    balance: ()=> {
                        return this.environment["fish"].renewal() - this.population['fisher'].cardinality * this.population['fisher'].profession.efficiency;
                    },
                    act: ()=> {
                        this.environment["fish"].quantity += this.environment["fish"].renewal() / this.tickFrequency;
                    }

                }

            },
            unlocks: ['Sailing'],
            prerequisites: []
        }
    };
    public population: Population = {
        idle: {
            cardinality: 1,
            profession: {
                name: 'idle',
                foodConsumption: 0.1,
                efficiency: 0.01,
                upgradeCost: 3,
                act: (efficiency: number, controller: TribeController)=> {
                    controller.resources["children"].quantity += efficiency;
                    var toAdd = Math.floor(controller.resources["children"].quantity);
                    if (toAdd > 0) {
                        controller.resources["children"].quantity -= toAdd;
                        _(controller.population).filter((item: PopulationEntry)=> {
                            return item.profession.name == "idle";
                        }).forEach((item: PopulationEntry)=> {
                            item.cardinality += toAdd;
                        });
                    }

                }
            }
        },
        scientist: {
            cardinality: 0,
            profession: {
                name: 'scientist',
                foodConsumption: 0.4,
                efficiency: 0.01,
                upgradeCost: 6,
                act: (efficiency: number, controller: TribeController)=> {
                    controller.resources["science"].quantity += efficiency;
                }
            }
        },
        gatherer: {
            cardinality: 2,
            profession: {
                name: 'gatherer',
                foodConsumption: 0.2,
                efficiency: 0.3,
                upgradeCost: 1,
                act: (efficiency)=> {
                    if (this.environment["berries"].quantity - efficiency > 0) {
                        this.resources["food"].quantity += efficiency;
                        this.environment["berries"].quantity -= efficiency;
                    } else {
                        this.resources["food"].quantity += this.environment["berries"].quantity;
                        this.environment["berries"].quantity = 0;
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
                this.population["farmer"] = {
                    cardinality: 0,
                    profession: {
                        name: 'farmer',
                        foodConsumption: 0.2,
                        efficiency: 0.25,
                        upgradeCost: 5,
                        act: (efficiency)=> {
                            this.resources["food"].quantity += efficiency;
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
                this.resources['ore'] = {
                    name: 'ore',
                    quantity: 0,
                    balance: ()=> {
                        if (this.population['miner']) {
                            return this.population['miner'].cardinality * this.population['miner'].profession.efficiency;
                        }
                    }
                };
                this.population["miner"] = {
                    cardinality: 0,
                    profession: {
                        name: 'miner',
                        foodConsumption: 0.6,
                        efficiency: 0.2,
                        upgradeCost: 5,
                        act: (efficiency)=> {
                            this.resources["ore"].quantity += efficiency;
                        }
                    }
                };
            },
            unlocks: ['Animal Husbandry', 'Archery', 'Mining', 'Pottery'],
            prerequisites: ['Crafting', 'Settlement']
        },
    };


    public availableWorkers(): boolean {
        return _(this.population).filter((item: PopulationEntry)=> {
                return item.profession.name == "idle";
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
        this.resources["food"].quantity -= _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.foodConsumption / this.tickFrequency;
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
        this.population['idle'].cardinality--;
        worker.cardinality++;
    }

    public removeWorker(worker: PopulationEntry): void {
        this.population['idle'].cardinality++;
        worker.cardinality--;
    }

    private starve() {
        let totalFoodConsumption = this.getTotalFoodConsumed();
        while (totalFoodConsumption > this.resources["food"].quantity) {
            let numOfIdlers = this.population['idle'].cardinality;
            let index: number = Math.floor(Math.random() * _.keys(this.population).length);
            let populationEntry: PopulationEntry = numOfIdlers > 0 ? this.population['idle'] : this.population[_.keys(this.population)[index]];
            if (populationEntry.cardinality > 0) {
                totalFoodConsumption -= populationEntry.profession.foodConsumption;
                populationEntry.cardinality--;
            }
        }
    }

    public getTotalPopulation() {
        return _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality;
        }).sum();
    }

    public getTotalFoodConsumed() {
        return _(this.population).map((item: PopulationEntry)=> {
            return item.cardinality * item.profession.foodConsumption;
        }).sum();
    }

    public research(tech: Tech) {
        this.resources["science"].quantity -= tech.price;
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
    foodConsumption: number
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