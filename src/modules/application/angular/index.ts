import "angular";
import {Tribe} from "./components/tribe/Tribe";

angular.module("app.application", ['ngMaterial'])
    .component("tribe", new Tribe());