import "angular";
import {Tribe} from "./components/tribe/Tribe";

angular.module("app.application", [])
    .component("tribe", new Tribe());