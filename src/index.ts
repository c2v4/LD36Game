import "./modules/application/angular/index";
import "angular";
import "font-awesome/css/font-awesome.css";
import "bootstrap/dist/css/bootstrap.css";
import "angular-material/angular-material.css";
import "angular-material/angular-material.js";
import "angular-aria/angular-aria.js";
import "angular-animate/angular-animate.js";
import "angular-cookies/angular-cookies.js";
import "./styles/screen.scss";

// load our default (non specific) css

angular.module("app", ["app.application"]);
angular.bootstrap(document, ["app"], {
    strictDi: true
});