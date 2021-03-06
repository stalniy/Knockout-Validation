﻿var api = (function () {

	var isInitialized = 0,
		configuration = ko.validation.configuration,
		utils = ko.validation.utils;


	return {
		//Call this on startup
		//any config can be overridden with the passed in options
		init: function (options, force) {
			//done run this multiple times if we don't really want to
			if (isInitialized > 0 && !force) {
				return;
			}

			//becuase we will be accessing options properties it has to be an object at least
			options = options || {};
			//if specific error classes are not provided then apply generic errorClass
			//it has to be done on option so that options.errorClass can override default
			//errorElementClass and errorMessage class but not those provided in options
			options.errorElementClass = options.errorElementClass || options.errorClass || configuration.errorElementClass;
			options.errorMessageClass = options.errorMessageClass || options.errorClass || configuration.errorMessageClass;

			ko.utils.extend(configuration, options);

			if (configuration.registerExtenders) {
				ko.validation.registerExtenders();
			}

			isInitialized = 1;
		},
		// backwards compatability
		configure: function (options) {
			ko.validation.init(options);
		},

		// resets the config back to its original state
		reset: ko.validation.configuration.reset,

		formatMessage: function (message, options) {
			var value = typeof options.params !== "undefined" ? options.params : options;
			if (typeof message === 'function') {
				return message(value);
			}
			return message.replace(/\{0\}/gi, ko.utils.unwrapObservable(value));
		},

		// addRule:
		// This takes in a ko.observable and a Rule Context - which is just a rule name and params to supply to the validator
		// ie: ko.validation.addRule(myObservable, {
		//          rule: 'required',
		//          params: true
		//      });
		//
		addRule: function (observable, rule) {
			observable.extend({ validatable: true });

			//push a Rule Context to the observables local array of Rule Contexts
			observable.rules.push(rule);
			return observable;
		},

		// addAnonymousRule:
		// Anonymous Rules essentially have all the properties of a Rule, but are only specific for a certain property
		// and developers typically are wanting to add them on the fly or not register a rule with the 'ko.validation.rules' object
		//
		// Example:
		// var test = ko.observable('something').extend{(
		//      validation: {
		//          validator: function(val, someOtherVal){
		//              return true;
		//          },
		//          message: "Something must be really wrong!',
		//          params: true
		//      }
		//  )};
		addAnonymousRule: function (observable, ruleObj) {
			if (ruleObj['message'] === undefined) {
				ruleObj['message'] = 'Error';
			}

			//add the anonymous rule to the observable
			ko.validation.addRule(observable, ruleObj);
		},

		addExtender: function (ruleName) {
			ko.extenders[ruleName] = function (observable, params) {
				//params can come in a few flavors
				// 1. Just the params to be passed to the validator
				// 2. An object containing the Message to be used and the Params to pass to the validator
				// 3. A condition when the validation rule to be applied
				//
				// Example:
				// var test = ko.observable(3).extend({
				//      max: {
				//          message: 'This special field has a Max of {0}',
				//          params: 2,
				//          onlyIf: function() {
				//                      return specialField.IsVisible();
				//                  }
				//      }
				//  )};
				//
				if (params.message || params.onlyIf) { //if it has a message or condition object, then its an object literal to use
					return ko.validation.addRule(observable, {
						rule: ruleName,
						message: params.message,
						params: utils.isEmptyVal(params.params) ? true : params.params,
						condition: params.onlyIf
					});
				} else {
					return ko.validation.addRule(observable, {
						rule: ruleName,
						params: params
					});
				}
			};
		},

		// loops through all ko.validation.rules and adds them as extenders to
		// ko.extenders
		registerExtenders: function () { // root extenders optional, use 'validation' extender if would cause conflicts
			if (configuration.registerExtenders) {
				for (var ruleName in ko.validation.rules) {
					if (ko.validation.rules.hasOwnProperty(ruleName)) {
						if (!ko.extenders[ruleName]) {
							ko.validation.addExtender(ruleName);
						}
					}
				}
			}
		},

		//creates a span next to the @element with the specified error class
		insertValidationMessage: function (element) {
			var span = document.createElement('SPAN');
			span.className = utils.getConfigOptions(element).errorMessageClass;
			utils.insertAfter(element, span);
			return span;
		},

		//take an existing binding handler and make it cause automatic validations
		makeBindingHandlerValidatable: function (handlerName) {
			var init = ko.bindingHandlers[handlerName].init;

			ko.bindingHandlers[handlerName].init = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
				return ko.bindingHandlers.exposeValidationResult.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
			};
		}
	};

})();

// expose api publicly
ko.utils.extend(ko.validation, api);