/*=============================================================================
	Author:			Eric M. Barnard - @ericmbarnard								
 Modified:   Sergiy Stotskiy - @stalniy                    
	License:		MIT (http://opensource.org/licenses/mit-license.php)		
																				
	Description:	Validation Library for KnockoutJS							
===============================================================================
*/
/*globals require: false, exports: false, define: false, ko: false */

(function (factory) {
    // Module systems magic dance.

    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"), exports);
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapping` property
        factory(ko, ko.validation = {});
    }
}(function ( ko, exports, undefined ) {

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
;/*global ko: false*/

var defaults = {
	registerExtenders: true,
	messagesOnModified: true,
	errorsAsTitle: true,            // enables/disables showing of errors as title attribute of the target element.
	errorsAsTitleOnModified: false, // shows the error when hovering the input field (decorateElement must be true)
	messageTemplate: null,
	insertMessages: true,           // automatically inserts validation messages as <span></span>
	parseInputAttributes: false,    // parses the HTML5 validation attribute from a form element and adds that to the object
	writeInputAttributes: false,    // adds HTML5 input validation attributes to form elements that ko observable's are bound to
	decorateInputElement: false,         // false to keep backward compatibility
	decorateElementOnModified: true,// true to keep backward compatibility
	errorClass: null,               // single class for error message and element
	errorElementClass: 'validationElement',  // class to decorate error element
	errorMessageClass: 'validationMessage',  // class to decorate error message
	grouping: {
		deep: false,        //by default grouping is shallow
		observable: true    //and using observables
	},
	validate: {
		// throttle: 10
	}
};

// make a copy  so we can use 'reset' later
var configuration = extend({}, defaults);

configuration.html5Attributes = ['required', 'pattern', 'min', 'max', 'step', 'minlength', 'maxlength'];
configuration.html5InputTypes = ['email', 'number', 'date'];

configuration.reset = function () {
	extend(configuration, defaults);
};

kv.configuration = configuration;
;kv.utils = (function () {
	var seedId = new Date().getTime();

	var domData = koUtils.domData;
	var domDataKey = '__ko_validation__';

	var utils = {
		isArray: function (o) {
			return o.isArray || Object.prototype.toString.call(o) === '[object Array]';
		},
		isObject: function (o) {
			return o !== null && typeof o === 'object';
		},
		getValue: function (o) {
			return (typeof o === 'function' ? o() : o);
		},
		isValidatable: function (o) {
			return o && o.rules && o.isValid && o.isModified;
		},
		insertAfter: function (node, newNode) {
			node.parentNode.insertBefore(newNode, node.nextSibling);
		},
		newId: function () {
			return seedId += 1;
		},
		getConfigOptions: function (element) {
			var node = element, options;
			do {
				options = utils.contextFor(node, true);
				node = node.parentNode;
			} while (node && !options);

			return options || kv.configuration;
		},
		setDomData: function (node, data) {
			domData.set(node, domDataKey, data);
		},
		getDomData: function (node) {
			return domData.get(node, domDataKey);
		},
		contextFor: function (node, checkOnlyNode) {
			switch (node.nodeType) {
				case 1:
				case 8:
					var context = utils.getDomData(node);
					if (context) { return context; }
					if (!checkOnlyNode && node.parentNode) { return utils.contextFor(node.parentNode); }
					break;
			}
			return undefined;
		},
		isEmptyVal: function (val) {
			if (val === undefined) {
				return true;
			}
			if (val === null) {
				return true;
			}
			if (val === "") {
				return true;
			}
		},
		getOriginalElementTitle: function (element) {
			var savedOriginalTitle = element.getAttribute('data-orig-title'),
				hasSavedOriginalTitle = savedOriginalTitle !== null;

			return hasSavedOriginalTitle ? savedOriginalTitle : element.title;
		},
		async: function (expr) {
			if (window.setImmediate) { window.setImmediate(expr); }
			else { window.setTimeout(expr, 0); }
		},
		forEach: function (object, callback) {
			if (utils.isArray(object)) {
				return forEach(object, callback);
			}
			for (var prop in object) {
				if (object.hasOwnProperty(prop)) {
					callback(object[prop], prop);
				}
			}
		},

		observablesOf: function (obj, callback, options, level) {
			var result = [];

			if (obj.__kv_traversed === true) {
				return result;
			}

			if (options.deep) {
				if (!options.flagged) {
					options.flagged = [];
				}

		    obj.__kv_traversed = true;
		    options.flagged.push(obj);
			}

			//default level value depends on deep option.
			if (typeof level === "undefined") {
				level = options.deep ? 1 : -1;
			}

			if (ko.isObservable(obj)) {
				callback(obj, result);
			}

			//process recurisvely if it is deep grouping
			if (level !== 0) {
				var values, val = unwrap(obj);

				if (val && (utils.isArray(val) || utils.isObject(val))) {
					values = val;
				} else {
					values = [];
				}

				utils.forEach(values, function (observable) {
					//but not falsy things and not HTML Elements
					if (observable && !observable.nodeType) {
						result.push.apply(result, utils.observablesOf(observable, callback, options, level + 1));
					}
				});
			}

			if (level === 1 && options.deep) {
				// remove flags from objects
				var i = options.flagged.length;
				while (i--) {
					delete options.flagged[i].__kv_traversed;
				}
	      options.flagged.length = 0;
	      delete options.flagged;
			}

			return result;
		},


		// if html-5 validation attributes have been specified, this parses
		// the attributes on @element
		parseInputValidationAttributes: function (element, observable) {
			var config = kv.configuration;

			forEach(config.html5Attributes, function (attr) {
				var value = element.getAttribute(attr);
				if (value !== null) {
					if (value && !isNaN(+value)) {
						value = Number(value);
					}
					kv.addRule(observable, {
						rule: attr,
						params: !value && value !== 0 ? true : value
					});
				}
			});

			var type = element.type;
			if (koUtils.arrayIndexOf(config.html5InputTypes, type) !== -1) {
				kv.addRule(observable, {
					rule: type === 'date' ? 'dateISO' : type,
					params: true
				});
			}
		},

		// writes html5 validation attributes on the element passed in
		writeInputValidationAttributes: function (element, observable) {
			if (!utils.isValidatable(observable)) {
				return false;
			}

			var rules = observable.rules();
			var rulesMap = {};
			forEach(rules, function (rule) {
				rulesMap[rule.rule.toLowerCase()] = rule;
			});

			// loop through the attributes and add the information needed
			forEach(kv.configuration.html5Attributes, function (attr) {
				var rule = rulesMap[attr.toLowerCase()];

				if (!rule) {
					return true;
				}

				var params = rule.params;
				// we have to do some special things for the pattern validation
				if (rule.rule === "pattern" && params instanceof RegExp) {
					params = params.source; // we need the pure string representation of the RegExpr without the //gi stuff
				}

				element.setAttribute(attr, params);
			});
		}
	};

	return utils;
})();;var api = (function () {

	var isInitialized = 0,
		configuration = kv.configuration,
		utils = kv.utils;


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

			extend(configuration, options);

			if (configuration.registerExtenders) {
				kv.registerExtenders();
			}

			isInitialized = 1;
		},
		// backwards compatability
		configure: function (options) {
			kv.init(options);
		},

		// resets the config back to its original state
		reset: kv.configuration.reset,

		formatMessage: function (message, options) {
			var value = typeof options.params !== "undefined" ? options.params : options;
			if (typeof message === 'function') {
				return message(value);
			}
			return message.replace(/\{0\}/gi, unwrap(value));
		},

		// addRule:
		// This takes in a ko.observable and a Rule Context - which is just a rule name and params to supply to the validator
		// ie: kv.addRule(myObservable, {
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
		// and developers typically are wanting to add them on the fly or not register a rule with the 'kv.rules' object
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
			kv.addRule(observable, ruleObj);
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
					return kv.addRule(observable, {
						rule: ruleName,
						message: params.message,
						params: utils.isEmptyVal(params.params) ? true : params.params,
						condition: params.onlyIf
					});
				} else {
					return kv.addRule(observable, {
						rule: ruleName,
						params: params
					});
				}
			};
		},

		// loops through all kv.rules and adds them as extenders to
		// ko.extenders
		registerExtenders: function () { // root extenders optional, use 'validation' extender if would cause conflicts
			if (configuration.registerExtenders) {
				for (var ruleName in kv.rules) {
					if (kv.rules.hasOwnProperty(ruleName)) {
						if (!ko.extenders[ruleName]) {
							kv.addExtender(ruleName);
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
				return koBindingHandlers.exposeValidationResult.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
			};
		}
	};

})();

// expose api publicly
extend(ko.validation, api);;(function (holder) {
  var utils = holder.utils;

  function ValidatableModel(observables, options) {
    this.each = makeIteratorFrom(forEach, observables);
    this.find = makeIteratorFrom(koUtils.arrayFirst, observables);
    this.errors = this.errors.bind(this);

    setUp(this, options);
  }

  ValidatableModel.prototype = {
    markAsModified: function (state) {
      var isModified = arguments.length === 0 || state;

      this.each(function (observable) {
        observable.isModified(isModified);
      });
      return this;
    },

    isAnyInvalidModified: function () {
      return !!this.find(function (observable) {
        return !observable.isValid() && observable.isModified();
      });
    },

    isModified: function () {
      return !!this.find(function (observable) {
        return observable.isModified();
      });
    },

    isValid: function () {
      return this.errors().length === 0;
    },

    errors: function () {
      return collectErrorsOf(this);
    }
  };

  function setUp(model, options) {
    if (options.observable) {
      var errors = ko.computed(model.errors);
      var isValid = ko.observable(errors().length === 0);

      errors.throttleEvaluation = 10;
      errors.subscribe(function (list) { isValid(list.length === 0); });

      model.errors = errors;
      model.isValid = isValid;
    }
  }

  function makeIteratorFrom(innerIterator, items) {
    return function (callback, context) {
      if (context) {
        callback = callback.bind(context);
      }
      return innerIterator(items, callback);
    };
  }

  function collectErrorsOf(model) {
    var errors = [];
    model.each(function (observable) {
      if (!observable.isValid()) {
        errors.push(observable.error);
      }
    });
    return errors;
  }

  function ensureIsValidatable(observable, result) {
    if (!utils.isValidatable(observable)) {
      observable.extend({ validatable: true });
    }
    result.push(observable);
  }

  // recursivly walks a viewModel and creates an object that
  // provides validation information for the entire viewModel
  // obj -> the viewModel to walk
  // options -> {
  //      deep: false, // if true, will walk past the first level of viewModel properties
  //      observable: false // if true, returns a computed observable indicating if the viewModel is valid
  // }
  holder.model = function (model, options) { // array of observables or viewModel
    options = extend(extend({}, holder.configuration.grouping), options);

    var observables = utils.observablesOf(model, ensureIsValidatable, options);

    return extend(new ValidatableModel(observables, options), model);
  };

})(ko.validation);;(function () {
	//Validation Rules:
	// You can view and override messages or rules via:
	// kv.rules[ruleName]
	//
	// To implement a custom Rule, simply use this template:
	// kv.rules['<custom rule name>'] = {
	//      validator: function (val, param) {
	//          <custom logic>
	//          return <true or false>;
	//      },
	//      message: '<custom validation message>' //optionally you can also use a '{0}' to denote a placeholder that will be replaced with your 'param'
	// };
	//
	// Example:
	// kv.rules['mustEqual'] = {
	//      validator: function( val, mustEqualVal ){
	//          return val === mustEqualVal;
	//      },
	//      message: 'This field must equal {0}'
	// };
	//
	var rules = {};
	rules['required'] = {
		validator: function (val, required) {
			var stringTrimRegEx = /^\s+|\s+$/g,
				testVal;

			if (val === undefined || val === null) {
				return !required;
			}

			testVal = val;
			if (typeof (val) === "string") {
				testVal = val.replace(stringTrimRegEx, '');
			}

			if (!required) {// if they passed: { required: false }, then don't require this
				return true;
			}

			return ((testVal + '').length > 0);
		},
		message: 'This field is required.'
	};

	rules['min'] = {
		validator: function (val, min) {
			return kv.utils.isEmptyVal(val) || val >= min;
		},
		message: 'Please enter a value greater than or equal to {0}.'
	};

	rules['max'] = {
		validator: function (val, max) {
			return kv.utils.isEmptyVal(val) || val <= max;
		},
		message: 'Please enter a value less than or equal to {0}.'
	};

	rules['minLength'] = {
		validator: function (val, minLength) {
			return kv.utils.isEmptyVal(val) || val.length >= minLength;
		},
		message: 'Please enter at least {0} characters.'
	};

	rules['maxLength'] = {
		validator: function (val, maxLength) {
			return kv.utils.isEmptyVal(val) || val.length <= maxLength;
		},
		message: 'Please enter no more than {0} characters.'
	};

	rules['pattern'] = {
		validator: function (val, regex) {
			return kv.utils.isEmptyVal(val) || val.toString().match(regex) !== null;
		},
		message: 'Please check this value.'
	};

	rules['step'] = {
		validator: function (val, step) {

			// in order to handle steps of .1 & .01 etc.. Modulus won't work
			// if the value is a decimal, so we have to correct for that
			if (kv.utils.isEmptyVal(val) || step === 'any') { return true; }
			var dif = (val * 100) % (step * 100);
			return Math.abs(dif) < 0.00001 || Math.abs(1 - dif) < 0.00001;
		},
		message: 'The value must increment by {0}'
	};

	rules['email'] = {
		validator: function (val, validate) {
			if (!validate) { return true; }

			//I think an empty email address is also a valid entry
			//if one want's to enforce entry it should be done with 'required: true'
			return kv.utils.isEmptyVal(val) || (
				// jquery validate regex - thanks Scott Gonzalez
				validate && /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(val)
			);
		},
		message: 'Please enter a proper email address'
	};

	rules['date'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return kv.utils.isEmptyVal(value) || (validate && !/Invalid|NaN/.test(new Date(value)));
		},
		message: 'Please enter a proper date'
	};

	rules['dateISO'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return kv.utils.isEmptyVal(value) || (validate && /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value));
		},
		message: 'Please enter a proper date'
	};

	rules['number'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return kv.utils.isEmptyVal(value) || (validate && /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value));
		},
		message: 'Please enter a number'
	};

	rules['digit'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return kv.utils.isEmptyVal(value) || (validate && /^\d+$/.test(value));
		},
		message: 'Please enter a digit'
	};

	rules['phoneUS'] = {
		validator: function (phoneNumber, validate) {
			if (!validate) { return true; }
			if (kv.utils.isEmptyVal(phoneNumber)) { return true; } // makes it optional, use 'required' rule if it should be required
			if (typeof (phoneNumber) !== 'string') { return false; }
			phoneNumber = phoneNumber.replace(/\s+/g, "");
			return validate && phoneNumber.length > 9 && phoneNumber.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
		},
		message: 'Please specify a valid phone number'
	};

	rules['equal'] = {
		validator: function (val, params) {
			var otherValue = params;
			return val === kv.utils.getValue(otherValue);
		},
		message: 'Values must equal'
	};

	rules['notEqual'] = {
		validator: function (val, params) {
			var otherValue = params;
			return val !== kv.utils.getValue(otherValue);
		},
		message: 'Please choose another value.'
	};

	//unique in collection
	// options are:
	//    collection: array or function returning (observable) array
	//              in which the value has to be unique
	//    valueAccessor: function that returns value from an object stored in collection
	//              if it is null the value is compared directly
	//    external: set to true when object you are validating is automatically updating collection
	rules['unique'] = {
		validator: function (val, options) {
			var c = kv.utils.getValue(options.collection),
				external = kv.utils.getValue(options.externalValue),
				counter = 0;

			if (!val || !c) { return true; }

			koUtils.arrayFilter(unwrap(c), function (item) {
				if (val === (options.valueAccessor ? options.valueAccessor(item) : item)) { counter++; }
			});
			// if value is external even 1 same value in collection means the value is not unique
			return counter < (external !== undefined && val !== external ? 1 : 2);
		},
		message: 'Please make sure the value is unique.'
	};

	rules.minlength = rules.minLength;
	rules.maxlength = rules.maxLength;

	kv.rules = rules;

	kv.registerExtenders();
})();;// The core binding handler
// this allows us to setup any value binding that internally always
// performs the same functionality
koBindingHandlers.exposeValidationResult = (function () {
	return {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var config = kv.utils.getConfigOptions(element);
			var observable = valueAccessor();

			// parse html5 input validation attributes, optional feature
			if (config.parseInputAttributes) {
				kv.utils.async(function () {
					kv.utils.parseInputValidationAttributes(element, observable);
				});
			}

			if (!kv.utils.isValidatable(observable)) {
				return false;
			}

			if (config.insertMessages) {
				var messageNode = kv.insertValidationMessage(element);
				if (config.messageTemplate) {
					ko.renderTemplate(config.messageTemplate, { field: observable }, null, messageNode, 'replaceNode');
				} else {
					ko.applyBindingsToNode(messageNode, { validationMessage: observable });
				}
			}

			// write the html5 attributes if indicated by the config
			if (config.writeInputAttributes) {
				kv.utils.writeInputValidationAttributes(element, observable);
			}

			// if requested, add binding to decorate element
			if (config.decorateInputElement) {
				ko.applyBindingsToNode(element, { validationStyle: observable });
			}
		}
	};

}());

// override for KO's default 'value' and 'checked' bindings
kv.makeBindingHandlerValidatable("value");
kv.makeBindingHandlerValidatable("checked");


koBindingHandlers.validationMessage = { // individual error message, if modified or post binding
	update: function (element, valueAccessor) {
		var observable = valueAccessor();

		if (!kv.utils.isValidatable(observable)) {
			throw new Error("Observable is not validatable");
		}

		var
			config = kv.utils.getConfigOptions(element),
			state  = observable.validationState();

		var error = null, shouldShowError = false;
		if (!config.messagesOnModified || state.isModified) {
			error = state.isValid ? null : state.error;
			shouldShowError = !state.isValid;
		}

		if (shouldShowError) {
			koBindingHandlers.text.update(element, function () { return error; });
		}
		koBindingHandlers.validationMessage.toggleErrorVisibility(element, shouldShowError);
	},

	toggleErrorVisibility: function (element, shouldShow) {
		var isCurrentlyErrorVisible = element.style.display !== "none";
		if (isCurrentlyErrorVisible && !shouldShow) {
			element.style.display = 'none';
		} else if (!isCurrentlyErrorVisible && shouldShow) {
			element.style.display = '';
		}
	}
};

koBindingHandlers.validationStyle = {
	update: function (element, valueAccessor) {
		var observable = valueAccessor();

		if (!kv.utils.isValidatable(observable)) {
			throw new Error("Observable is not validatable");
		}

		var
			config = kv.utils.getConfigOptions(element),
			state  = observable.validationState();

		//add or remove class on the element;
		koBindingHandlers.css.update(element, function () {
			var classes = {};
			classes[config.errorElementClass] = !config.decorateElementOnModified || state.isModified ? !state.isValid : false;

			return classes;
		});

		if (config.errorsAsTitle) {
			koBindingHandlers.validationStyle.setErrorAsTitleOn(element, observable, config);
		}
	},

	setErrorAsTitleOn: function (element, observable, config) {
		var state = observable.validationState();

		koBindingHandlers.attr.update(element, function () {
			var title = kv.utils.getOriginalElementTitle(element);
			var hasModification = !config.errorsAsTitleOnModified || state.isModified;

			if (hasModification && !state.isValid) {
				return { title: state.error, 'data-orig-title': title };
			} else if (!hasModification || state.isValid) {
				return { title: title, 'data-orig-title': null };
			}
		});
	}
};

// ValidationOptions:
// This binding handler allows you to override the initial config by setting any of the options for a specific element or context of elements
//
// Example:
// <div data-bind="validationOptions: { insertMessages: true, messageTemplate: 'customTemplate', errorMessageClass: 'mySpecialClass'}">
//      <input type="text" data-bind="value: someValue"/>
//      <input type="text" data-bind="value: someValue2"/>
// </div>
koBindingHandlers.validationOptions = {
	init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var options = unwrap(valueAccessor());
		if (options) {
			var newConfig = extend({}, kv.configuration);
			extend(newConfig, options);

			//store the validation options on the node so we can retrieve it later
			kv.utils.setDomData(element, newConfig);
		}
	}
};

;(function () {
	// Validation Extender:
	// This is for creating custom validation logic on the fly
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
	ko.extenders['validation'] = function (observable, rules) { // allow single rule or array
		forEach(kv.utils.isArray(rules) ? rules : [rules], function (rule) {
			// the 'rule' being passed in here has no name to identify a core Rule,
			// so we add it as an anonymous rule
			// If the developer is wanting to use a core Rule, but use a different message see the 'addExtender' logic for examples
			kv.addAnonymousRule(observable, rule);
		});
		return observable;
	};

	function trackIsModified() {
		this.target.isModified(true);
	}

	function clearError() {
		this(null);
	}

	function isErrorEmpty() {
		return this() === null;
	}

	function failedRule(rule) {
		if (arguments.length === 1) {
			this.__failedRule = rule;
			return this;
		}
		return this.__failedRule;
	}

	function returnValidationState() {
		return {
			isModified : this.isModified(),
			isValid    : this.isValid(),
			error      : this.error()
		};
	}

	//This is the extender that makes a Knockout Observable also 'Validatable'
	//examples include:
	// 1. var test = ko.observable('something').extend({validatable: true});
	// this will ensure that the Observable object is setup properly to respond to rules
	//
	// 2. test.extend({validatable: false});
	// this will remove the validation properties from the Observable object should you need to do that.
	ko.extenders['validatable'] = function (observable, options) {
		if (!kv.utils.isObject(options)) {
			options = { enable: options };
		}

		if (!('enable' in options)) {
			options.enable = true;
		}

		if (options.enable && !kv.utils.isValidatable(observable)) {
			observable.error = ko.observable(null); // holds the error message, we only need one since we stop processing validators when one is invalid
			observable.error.clear = clearError;
			observable.error.isEmpty = isErrorEmpty;

			// observable.rules:
			// ObservableArray of Rule Contexts, where a Rule Context is simply the name of a rule and the params to supply to it
			//
			// Rule Context = { rule: '<rule name>', params: '<passed in params>', message: '<Override of default Message>' }
			observable.rules = ko.observableArray(); //holds the rule Contexts to use as part of validation

			// returns rule which made observable invalid
			observable.failedRule = failedRule;
			observable.failedRule(null);

			//in case async validation is occuring
			observable.isValidating = ko.observable(false);

			observable.isModified = ko.observable(false);

			observable.isValid = ko.observable(true);
			observable.error.subscribe(function (error) {
				observable.isValid(observable.error.isEmpty());
			});

			//subscribe to changes in the observable
			var isModifiedSubscription = observable.subscribe(trackIsModified);

			// we use a computed here to ensure that anytime a dependency changes, the
			// validation logic evaluates
			var validationTrigger = ko.computed(function () {
				observable(); // create dependency
				kv.process(observable);
			});

			var config = kv.configuration.validate;
			var throttleTimeout = options.throttle || config && config.throttle;

			observable.validationState = ko.computed({
				read: returnValidationState,
				deferEvaluation: true
			}, observable);
			observable.validationState.throttleEvaluation = throttleTimeout ? throttleTimeout + 1 : null;
			validationTrigger.throttleEvaluation = throttleTimeout;

			observable._disposeValidation = function () {
				this.rules.removeAll();
				isModifiedSubscription.dispose();
				validationTrigger.dispose();
				this.validationState.dispose();

				delete this['rules'];
				delete this['error'];
				delete this['isValid'];
				delete this['isValidating'];
				delete this['isModified'];
			};
		} else if (options.enable === false && observable._disposeValidation) {
			observable._disposeValidation();
		}
		return observable;
	};

	function validateSync(observable, rule, ctx) {
		var params = typeof ctx.params === "undefined" ? true : ctx.params;
		//Execute the validator and see if its valid
		if (!rule.validator(observable(), params)) {
			//not valid, so format the error message and stick it in the 'error' variable
			observable.failedRule(ctx).error(kv.formatMessage(ctx.message || rule.message, ctx));
			return false;
		}
		return true;
	}

	function validateAsync(observable, rule, ctx) {
		observable.isValidating(true);
		//fire the validator and hand it the callback
		rule.validator(observable(), ctx.params || true, function (validationResult) {
			if (observable.isValid()) {
				var isValid = validationResult, message;

				//we were handed back a complex object
				if (kv.utils.isObject(validationResult)) {
					isValid = validationResult.isValid;
					message = validationResult.message || '';
				}

				if (!isValid) {
					//not valid, so format the error message and stick it in the 'error' variable
					observable.failedRule(ctx).error(kv.formatMessage(message || ctx.message || rule.message, ctx));
				}
			}

			// tell it that we're done
			observable.isValidating(false);
		});
	}

	kv.process = function (observable) {
		var rule, // the rule validator to execute
			ctx, // the current Rule Context for the loop
			ruleContexts = observable.rules(); //cache for iterator

		for (var i = 0, count = ruleContexts.length; i < count; i++) {
			ctx = ruleContexts[i];

			// checks an 'onlyIf' condition
			if (ctx.condition && !ctx.condition()) {
				continue;
			}

			//get the core Rule to use for validation
			rule = ctx.rule ? kv.rules[ctx.rule] : ctx;

			if (rule.async || ctx.async) {
				validateAsync(observable, rule, ctx);
			} else if (!validateSync(observable, rule, ctx)) {
				return false; //break out of the loop
			}
		}
		//finally if we got this far, make the observable valid again!
		observable.failedRule(null).error.clear();
		return true;
	};
})();
;ko.applyBindingsWithValidation = function (viewModel, rootNode, options) {
	var len = arguments.length,
		node, config;

	if (len > 2) { // all parameters were passed
		node = rootNode;
		config = options;
	} else if (len < 2) {
		node = document.body;
	} else { //have to figure out if they passed in a root node or options
		if (arguments[1].nodeType) { //its a node
			node = rootNode;
		} else {
			config = arguments[1];
		}
	}

	kv.init();

	if (config) {
		kv.utils.setDomData(node, config);
	}

	ko.applyBindings(viewModel, rootNode);
};

ko.validatedObservable = function (initialValue) {
	return ko.observable(initialValue).extend({ validatable: true });
};
;}));