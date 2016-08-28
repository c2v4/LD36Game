import "angular";
import {Tribe} from "./components/tribe/Tribe";

angular.module("app.application", ['ngMaterial', 'ngMdIcons'])
    .component("tribe", new Tribe());