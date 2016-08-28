import IIntervalService = angular.IIntervalService;
import * as _ from "lodash";
import moment = require("moment");
import Moment = moment.Moment;

export class Tribe implements ng.IComponentOptions {
    public controller: Function = TribeController;
    public template: string = require("./tribe-template.html");
    public controllerAs: string = "vm"
}
class TribeController {
    get allTechs(): TechTree {
        return this._allTechs;
    }

    set allTechs(value: TechTree) {
        this._allTechs = value;
    }

    static $inject: Array<string> = ['$interval', '$mdDialog', '$mdPanel'];

    constructor(public $interval: IIntervalService, public $mdDialog: angular.material.IDialogService, public $mdPanel: angular.material.IPanelService) {
        $interval(this.tick, 1000 / this.tickFrequency);
        this.updateStep();
    }

    public controller: TribeController = this;
    public step: number = 1;
    public tickFrequency = 4;
    public upgradeEfficiency: number = 1.1;
    public historyAccess: boolean = false;
    public calendarAccess: boolean = false;
    public detailedView: boolean = false;
    public philosophyAccess: boolean = false;
    public date: Moment;

    public availableSteps: Array<number> = [];

    public resources: Resources = {
        Science: {
            name: "Science",
            quantity: 0,
            balanceNumber: 0,
            balance: ()=> {
                let number = this.population['Scientist'].cardinality * this.population['Idle'].profession.efficiency;
                return number;
            }
        },
        Children: {
            name: "Children",
            quantity: 0,
            balanceNumber: 0,
            balance: ()=> {
                let number = this.population['Idle'].cardinality * this.population['Idle'].profession.efficiency;
                return number;
            }
        },
        Food: {
            name: "Food",
            quantity: 10,
            balanceNumber: 0,
            balance: ()=> {
                let balance: number = -this.getTotalFoodConsumed();
                if (this.population["Hunter"]) {
                    let huntersEfficiency = this.population["Hunter"].profession.efficiency * this.population["Hunter"].cardinality;
                    if (this.environment["Animals"].quantity > huntersEfficiency) {
                        balance += huntersEfficiency;
                        this.environment["Animals"].quantity -= huntersEfficiency / this.tickFrequency;
                    } else {
                        balance += this.environment["Animals"].quantity;
                        this.environment["Animals"].quantity -= this.environment["Animals"].quantity / this.tickFrequency;
                    }
                }
                let gathererEfficiency = this.population["Gatherer"].profession.efficiency * this.population["Gatherer"].cardinality;
                if (this.environment["Berries"].quantity > gathererEfficiency) {
                    balance += gathererEfficiency;
                    this.environment["Berries"].quantity -= gathererEfficiency / this.tickFrequency;
                } else {
                    balance += this.environment["Berries"].quantity;
                    this.environment["Berries"].quantity -= this.environment["Berries"].quantity / this.tickFrequency;
                }
                if (this.population["Fisher"]) {
                    let fisherEfficiency = this.population["Fisher"].profession.efficiency * this.population["Fisher"].cardinality;
                    if (this.environment["Fish"].quantity > fisherEfficiency) {
                        balance += fisherEfficiency;
                        this.environment["Fish"].quantity -= fisherEfficiency / this.tickFrequency;
                    } else {
                        balance += this.environment["Berries"].quantity;
                        this.environment["Fish"].quantity -= this.environment["Fish"].quantity / this.tickFrequency;
                    }
                }
                if (this.population["Potter"]) {
                    if (balance > 0) {
                        balance *= 2 - 100 / (100 + this.population["Potter"].cardinality * this.population["Potter"].profession.efficiency);
                    } else {
                        balance *= 100 / (100 + this.population["Potter"].cardinality * this.population["Potter"].profession.efficiency);
                    }
                }
                return balance;
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
                return (3 / (Math.pow((this.environment["Berries"].quantity - 120) / 10, 2) + 1)) + (this.population["Farmer"] ? (this.population["Farmer"].cardinality * this.population["Farmer"].profession.efficiency) : 0);
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
                        foodConsumption: 0.3,
                        efficiency: 0.5,
                        upgradeCost: 1,
                    }
                };
                this.environment["Animals"] =
                {
                    name: "Animals",
                    quantity: 80,
                    renewal: ()=> {
                        return (6 / (Math.pow((this.environment["Animals"].quantity - 120) / 10, 2) + 1)) + (this.population["Shepherd"] ? (this.population["Shepherd"].cardinality * this.population["Shepherd"].profession.efficiency) : 0);
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
                this.resources['Tools'] = {
                    name: 'Tools',
                    quantity: 0,
                    balanceNumber: 0,
                    balance: ()=> {
                        if (this.population['Crafter']) {
                            let balance: number = 0;
                            let crafterEfficiency = this.population['Crafter'].cardinality * this.population['Crafter'].profession.efficiency;
                            if (this.resources["Iron"]) {
                                if (this.resources["Iron"].quantity > crafterEfficiency) {
                                    return 6 * crafterEfficiency;
                                } else {
                                    balance += 6 * this.resources["Iron"].quantity;
                                    crafterEfficiency -= this.resources["Iron"].quantity;
                                }
                            }
                            if (this.resources["Bronze"] && crafterEfficiency > 0) {
                                if (this.resources["Bronze"].quantity > crafterEfficiency) {
                                    balance += 3 * crafterEfficiency;
                                } else {
                                    balance += 3 * this.resources["Bronze"].quantity;
                                }
                                crafterEfficiency -= this.resources["Bronze"].quantity;
                            }
                            balance += crafterEfficiency;
                            return balance;
                        }
                    }
                };
                this.population["Crafter"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Crafter',
                        foodConsumption: 0.5,
                        efficiency: 0.01,
                        upgradeCost: 8,
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
                this.population["Idle"].profession.efficiency += 0.01;
            },
            unlocks: ['Agriculture'],
            prerequisites: []
        },
        "Alphabet": {
            name: 'Alphabet',
            price: 4,
            researched: ()=> {
                this.population["Scientist"].profession.efficiency += 0.01
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
                        foodConsumption: 0.3,
                        efficiency: 0.5,
                        upgradeCost: 1,
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
                foodConsumption: 0.1,
                efficiency: 0.01,
                upgradeCost: 3,
            }
        },
        Scientist: {
            cardinality: 0,
            profession: {
                name: 'Scientist',
                foodConsumption: 0.4,
                efficiency: 0.01,
                upgradeCost: 6,
            }
        },
        Gatherer: {
            cardinality: 2,
            profession: {
                name: 'Gatherer',
                foodConsumption: 0.2,
                efficiency: 0.3,
                upgradeCost: 1,
            }
        }
    };

    private _allTechs: TechTree = {
        "Agriculture": {
            name: 'Agriculture',
            price: 10,
            researched: ()=> {
                this.population["Farmer"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Farmer',
                        foodConsumption: 0.2,
                        efficiency: 0.5,
                        upgradeCost: 5,
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
                    balanceNumber: 0,
                    balance: ()=> {
                        let balance: number = 0;
                        if (this.population['Miner']) {
                            balance += this.population['Miner'].cardinality * this.population['Miner'].profession.efficiency;
                        }
                        if (this.population["Metallurgist"]) {
                            let metallurgistEfficiency = this.population["Metallurgist"].profession.efficiency * this.population["Metallurgist"].cardinality;
                            if (this.resources["Ore"].quantity > metallurgistEfficiency) {
                                balance -= metallurgistEfficiency / this.tickFrequency;
                            } else {
                                balance -= this.resources["Ore"].quantity / this.tickFrequency;
                            }
                        }
                        if (this.population["Ironmaster"]) {
                            let ironmasterEfficiency = this.population["Ironmaster"].profession.efficiency * this.population["Ironmaster"].cardinality;
                            if (this.resources["Ore"].quantity > ironmasterEfficiency) {
                                balance -= ironmasterEfficiency / this.tickFrequency;
                            } else {
                                balance -= this.resources["Ore"].quantity / this.tickFrequency;
                            }
                        }

                        return balance;
                    }
                };
                this.population["Miner"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Miner',
                        foodConsumption: 0.6,
                        efficiency: 0.2,
                        upgradeCost: 5,
                    }
                };
            },
            unlocks: ['Bronze Working', 'Masonry'],
            prerequisites: ['Crafting', 'Settlement']
        },
        "Animal Husbandry": {
            name: 'Animal Husbandry',
            price: 15,
            researched: ()=> {
                this.population["Shepherd"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Shepherd',
                        foodConsumption: 0.3,
                        efficiency: 0.7,
                        upgradeCost: 7,
                    }
                };
            },
            unlocks: ['The Wheel', 'Trapping'],
            prerequisites: ['Hunting', 'Agriculture']
        },
        "Archery": {
            name: 'Archery',
            price: 12,
            researched: ()=> {
                this.population["Hunter"].profession.efficiency += 0.4;
            },
            unlocks: ['The Wheel', 'Trapping'],
            prerequisites: ['Hunting', 'Agriculture']
        },
        "Pottery": {
            name: 'Pottery',
            price: 16,
            researched: ()=> {
                this.population["Potter"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Potter',
                        foodConsumption: 0.4,
                        efficiency: 0.04,
                        upgradeCost: 7,
                    }
                };
            },
            unlocks: ['Writing', 'Calendar', 'Sailing', 'Irrigation'],
            prerequisites: ['Agriculture']
        },
        "The Wheel": {
            name: 'The Wheel',
            price: 25,
            researched: ()=> {
                this.upgradeEfficiency += 0.1;
            },
            unlocks: ['Mathematics', 'Horseback Riding'],
            prerequisites: ['Animal Husbandry', 'Archery']
        },
        "Trapping": {
            name: "Trapping",
            price: 23,
            researched: ()=> {
                this.population["Hunter"].profession.efficiency += 0.3;
            },
            unlocks: ['Horseback Riding'],
            prerequisites: ['Animal Husbandry', 'Archery']
        },
        "Bronze Working": {
            name: "Bronze Working",
            price: 32,
            researched: ()=> {
                this.population["Metallurgist"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Metallurgist',
                        foodConsumption: 0.5,
                        efficiency: 0.3,
                        upgradeCost: 7,
                    }
                };
                this.resources["Bronze"] = {
                    name: 'Bronze',
                    quantity: 0,
                    balanceNumber: 0,
                    balance: ()=> {
                        let balance: number = 0;
                        let metallurgistEfficiency = this.population["Metallurgist"].profession.efficiency * this.population["Metallurgist"].cardinality;
                        if (this.resources["Ore"].quantity > metallurgistEfficiency) {
                            balance += metallurgistEfficiency / 2;
                        } else {
                            balance += this.resources["Ore"].quantity / 2;
                        }
                        let crafterEfficiency = this.population['Crafter'].cardinality * this.population['Crafter'].profession.efficiency;
                        if (this.resources["Iron"]) {
                            if (this.resources["Iron"].quantity > crafterEfficiency) {
                                return balance
                            } else {
                                crafterEfficiency -= this.resources["Iron"].quantity;
                            }
                        }
                        if (crafterEfficiency > 0) {
                            if (this.resources["Bronze"].quantity > crafterEfficiency) {
                                balance -= crafterEfficiency;
                            } else {
                                balance = 0;
                            }
                        }
                        return balance;
                    }
                }
            },
            unlocks: ['Iron Working'],
            prerequisites: ['Mining']
        },
        "Masonry": {
            name: "Masonry",
            price: 22,
            researched: ()=> {
                this.population["Crafter"].profession.efficiency *= 1.5;
            },
            unlocks: ['Construction'],
            prerequisites: ['Mining']
        },
        "Writing": {
            name: "Writing",
            price: 6,
            researched: ()=> {
                _(_.keys(this.population)).forEach((key)=> {
                    this.population[key].profession.foodConsumption *= (0.8 + Math.random() * 0.4);
                    this.population[key].profession.efficiency *= (0.8 + Math.random() * 0.4);
                });
            },
            unlocks: ['Drama and Poetry', 'Philosophy'],
            prerequisites: ['Alphabet']
        },
        "Calendar": {
            name: "Calendar",
            price: 7,
            researched: ()=> {
                this.calendarAccess = true;
                this.date = moment().subtract(3000, 'years');
            },
            unlocks: ['Philosophy'],
            prerequisites: ['Pottery']
        },
        "Sailing": {
            name: "Sailing",
            price: 12,
            researched: ()=> {
                this.environment["Fish"].quantity *= 2;
                this.environment["Fish"]['renewal'] = ()=> {
                    return (12 / (Math.pow((this.environment["Fish"].quantity - 240) / 10, 2) + 1));
                };
            },
            unlocks: ['Cartography'],
            prerequisites: ['Fishing', 'Pottery']
        },
        "Irrigation": {
            name: "Irrigation",
            price: 26,
            researched: ()=> {
                this.environment["Berries"].quantity *= 2;
                this.environment["Berries"]['renewal'] = ()=> {
                    return (12 / (Math.pow((this.environment["Berries"].quantity - 240) / 10, 2) + 1));
                };
            },
            unlocks: ['Aqueduct'],
            prerequisites: ['Pottery']
        },
        "Mathematics": {
            name: "Mathematics",
            price: 19,
            researched: ()=> {
                this.detailedView = true;
            },
            unlocks: ['Currency'],
            prerequisites: ['The Wheel', 'Writing']
        },
        "Construction": {
            name: "Construction",
            price: 48,
            researched: ()=> {
                _(_.keys(this.population)).forEach((key)=> {
                    this.population[key].profession.efficiency *= 1.1;
                });
            },
            unlocks: ['Engineering'],
            prerequisites: ['The Wheel', 'Masonry']
        },
        "Currency": {
            name: "Currency",
            price: 86,
            researched: ()=> {
                _(_.keys(this.population)).forEach((key)=> {
                    this.population[key].cardinality *= Math.ceil(this.population[key].cardinality * 1.2);
                });
            },
            unlocks: ['Potato'],
            prerequisites: ['Mathematics']
        },
        "Engineering": {
            name: "Engineering",
            price: 97,
            researched: ()=> {
                _(_.keys(this.population)).forEach((key)=> {
                    this.population[key].profession.upgradeCost *= 0.5;
                });
            },
            prerequisites: ['Mathematics', 'Construction'],
            unlocks: ['Aqueduct']
        },
        "Iron Working": {
            name: "Iron Working",
            price: 70,
            researched: ()=> {
                this.population["Ironmaster"] = {
                    cardinality: 0,
                    profession: {
                        name: 'Ironmaster',
                        foodConsumption: 0.5,
                        efficiency: 0.3,
                        upgradeCost: 7,
                    }
                };
                this.resources["Iron"] = {
                    name: 'Iron',
                    quantity: 0,
                    balanceNumber: 0,
                    balance: ()=> {
                        let balance: number = 0;
                        let metallurgistEfficiency = this.population["Ironmaster"].profession.efficiency * this.population["Ironmaster"].cardinality;
                        if (this.resources["Ore"].quantity > metallurgistEfficiency) {
                            balance += metallurgistEfficiency / 4;
                        } else {
                            balance += this.resources["Ore"].quantity / 4;
                        }
                        let crafterEfficiency = this.population['Crafter'].cardinality * this.population['Crafter'].profession.efficiency;
                        if (this.resources["Iron"].quantity > crafterEfficiency) {
                            balance -= crafterEfficiency;
                        } else {
                            balance = 0;
                        }
                        return balance;
                    }
                }
            },
            prerequisites: ['Bronze Working'],
            unlocks: ['Potato']
        },
        "Cartography": {
            name: "Cartography",
            price: 65,
            researched: ()=> {
                this.resources["Animals"].quantity *= 2;
                this.resources["Animals"]['renewal'] = ()=> {
                    return (12 / (Math.pow((this.environment["Animals"].quantity - 240) / 10, 2) + 1));
                };

            },
            prerequisites: ['Mathematics', 'Sailing'],
            unlocks: ['Potato']
        },
        "Drama and Poetry": {
            name: "Drama and Poetry",
            price: 110,
            researched: ()=> {
                _(_.keys(this.population)).forEach((key)=> {
                    this.population[key].profession.foodConsumption *= 0.8;
                });
            },
            prerequisites: ['Writing'],
            unlocks: ['Potato']
        },
        "Philosophy": {
            name: "Philosophy",
            price: 54,
            researched: ()=> {
                this.philosophyAccess = true;
            },
            prerequisites: ['Writing', 'Calendar'],
            unlocks: ['Potato']
        },
        "Aqueduct": {
            name: "Aqueduct",
            price: 119,
            researched: ()=> {
                this.environment["Berries"].quantity *= 4;
                this.environment["Berries"]['renewal'] = ()=> {
                    return (24 / (Math.pow((this.environment["Berries"].quantity - 480) / 10, 2) + 1));
                };
            },
            prerequisites: ['Irrigation', 'Engineering'],
            unlocks: ['Potato']
        },
        "Potato": {
            name: "Potato",
            price: 169,
            researched: ()=> {
                /*
                 POTATO RESEARCHED!
                 */
            },
            prerequisites: ['Irrigation', 'Engineering'],
            unlocks: ['Potato']
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
        this.updateResources();
        this.breed();
        this.updateEnvironment();
        if (this.calendarAccess) {
            this.date.add(300 / this.tickFrequency, 'days');
        }
    };

    public updateResources(): void {
        _.keys(this.resources).forEach((key: string)=> {
            let balance = this.resources[key].balance();
            this.resources[key].balanceNumber = balance;
            this.resources[key].quantity += balance / this.tickFrequency;
        });
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
        let totalfoodConsumption = this.getTotalFoodConsumed();
        while (totalfoodConsumption > this.resources["Food"].quantity) {
            let numOfIdlers = this.population['Idle'].cardinality;
            let index: number = Math.floor(Math.random() * _.keys(this.population).length);
            let populationEntry: PopulationEntry = numOfIdlers > 0 ? this.population['Idle'] : this.population[_.keys(this.population)[index]];
            if (populationEntry.cardinality > 0) {
                totalfoodConsumption -= populationEntry.profession.foodConsumption;
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
            return item.cardinality * item.profession.foodConsumption;
        }).sum();
    }

    public research(tech: Tech) {
        this.resources["Science"].quantity -= tech.price;
        delete this.availableTechs[tech.name];
        this._allTechs[tech.name] || delete this._allTechs[tech.name];
        _(tech.unlocks).forEach((newTech: string)=> {
            if (this._allTechs[newTech] && !_(this._allTechs[newTech].prerequisites).some((prerequisite: string)=> {
                    return this._allTechs[prerequisite] || this.availableTechs[prerequisite];
                })) {
                this.availableTechs[newTech] = this._allTechs[newTech];
                delete this._allTechs[newTech];
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
        this.resources["Tools"].quantity -= profession.upgradeCost;
        profession.efficiency *= this.upgradeEfficiency;
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

    private breed() {
        var toAdd = Math.floor(this.resources["Children"].quantity);
        if (toAdd > 0) {
            this.resources["Children"].quantity -= toAdd;
            this.population["Idle"].cardinality += toAdd;
            this.updateStep();
        }
    }
}
interface Resources {
    [key: string]: Resource;
}
interface Resource {
    name: string
    quantity: number
    balanceNumber: number
    balance: Function
}

interface Profession {
    name: string
    foodConsumption: number
    efficiency: number
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