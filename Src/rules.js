﻿(function () {
	//Validation Rules:
	// You can view and override messages or rules via:
	// ko.validation.rules[ruleName]
	//
	// To implement a custom Rule, simply use this template:
	// ko.validation.rules['<custom rule name>'] = {
	//      validator: function (val, param) {
	//          <custom logic>
	//          return <true or false>;
	//      },
	//      message: '<custom validation message>' //optionally you can also use a '{0}' to denote a placeholder that will be replaced with your 'param'
	// };
	//
	// Example:
	// ko.validation.rules['mustEqual'] = {
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
			return ko.validation.utils.isEmptyVal(val) || val >= min;
		},
		message: 'Please enter a value greater than or equal to {0}.'
	};

	rules['max'] = {
		validator: function (val, max) {
			return ko.validation.utils.isEmptyVal(val) || val <= max;
		},
		message: 'Please enter a value less than or equal to {0}.'
	};

	rules['minLength'] = {
		validator: function (val, minLength) {
			return ko.validation.utils.isEmptyVal(val) || val.length >= minLength;
		},
		message: 'Please enter at least {0} characters.'
	};

	rules['maxLength'] = {
		validator: function (val, maxLength) {
			return ko.validation.utils.isEmptyVal(val) || val.length <= maxLength;
		},
		message: 'Please enter no more than {0} characters.'
	};

	rules['pattern'] = {
		validator: function (val, regex) {
			return ko.validation.utils.isEmptyVal(val) || val.toString().match(regex) !== null;
		},
		message: 'Please check this value.'
	};

	rules['step'] = {
		validator: function (val, step) {

			// in order to handle steps of .1 & .01 etc.. Modulus won't work
			// if the value is a decimal, so we have to correct for that
			if (ko.validation.utils.isEmptyVal(val) || step === 'any') { return true; }
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
			return ko.validation.utils.isEmptyVal(val) || (
				// jquery validate regex - thanks Scott Gonzalez
				validate && /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(val)
			);
		},
		message: 'Please enter a proper email address'
	};

	rules['date'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return ko.validation.utils.isEmptyVal(value) || (validate && !/Invalid|NaN/.test(new Date(value)));
		},
		message: 'Please enter a proper date'
	};

	rules['dateISO'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return ko.validation.utils.isEmptyVal(value) || (validate && /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value));
		},
		message: 'Please enter a proper date'
	};

	rules['number'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return ko.validation.utils.isEmptyVal(value) || (validate && /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value));
		},
		message: 'Please enter a number'
	};

	rules['digit'] = {
		validator: function (value, validate) {
			if (!validate) { return true; }
			return ko.validation.utils.isEmptyVal(value) || (validate && /^\d+$/.test(value));
		},
		message: 'Please enter a digit'
	};

	rules['phoneUS'] = {
		validator: function (phoneNumber, validate) {
			if (!validate) { return true; }
			if (ko.validation.utils.isEmptyVal(phoneNumber)) { return true; } // makes it optional, use 'required' rule if it should be required
			if (typeof (phoneNumber) !== 'string') { return false; }
			phoneNumber = phoneNumber.replace(/\s+/g, "");
			return validate && phoneNumber.length > 9 && phoneNumber.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
		},
		message: 'Please specify a valid phone number'
	};

	rules['equal'] = {
		validator: function (val, params) {
			var otherValue = params;
			return val === ko.validation.utils.getValue(otherValue);
		},
		message: 'Values must equal'
	};

	rules['notEqual'] = {
		validator: function (val, params) {
			var otherValue = params;
			return val !== ko.validation.utils.getValue(otherValue);
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
			var c = ko.validation.utils.getValue(options.collection),
				external = ko.validation.utils.getValue(options.externalValue),
				counter = 0;

			if (!val || !c) { return true; }

			ko.utils.arrayFilter(ko.utils.unwrapObservable(c), function (item) {
				if (val === (options.valueAccessor ? options.valueAccessor(item) : item)) { counter++; }
			});
			// if value is external even 1 same value in collection means the value is not unique
			return counter < (external !== undefined && val !== external ? 1 : 2);
		},
		message: 'Please make sure the value is unique.'
	};

	rules.minlength = rules.minLength;
	rules.maxlength = rules.maxLength;

	ko.validation.rules = rules;

	ko.validation.registerExtenders();
})();