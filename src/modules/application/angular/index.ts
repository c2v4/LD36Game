import "angular";
import {Tribe} from "./components/tribe/Tribe";

angular.module("app.application", ['ngMaterial', 'ngCookies'])
    .component("tribe", new Tribe());