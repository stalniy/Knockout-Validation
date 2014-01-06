(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports", "tkt"], factory);
    } else {
        factory(ko, ko.validation = {}, ko.tkt);
    }
}(function (ko, exports, tkt, undefined) {
    if (typeof ko === "undefined") {
        throw 'Knockout is required, please ensure it is loaded before loading this validation plug-in';
    }

    // create our namespace object
    ko.validation = exports;

    var kv = ko.validation;
    var koUtils = ko.utils;
    var unwrap = koUtils.unwrapObservable;
    var forEach = koUtils.arrayForEach;
    var extend = koUtils.extend;
    var koBindingHandlers = ko.bindingHandlers;
