(function () {
	var rules = {};

	function getValue(value) {
		return typeof value === 'function' ? value() : value;
	};

	rules.required = {
		mandatory: true,
		message: 'This field is required.',

		validate: function (value) {
			return value !== undefined && value !== null && String(val).trim().length > 0;
		}
	};

	rules.min = {
		message: 'Please enter a value greater than or equal to {0}.',

		validate: function (val, min) {
			return val >= min;
		}
	};

	rules.max = {
		message: 'Please enter a value less than or equal to {0}.',

		validate: function (val, max) {
			return val <= max;
		}
	};

	rules.minLength = {
		message: 'Please enter at least {0} characters.',

		validate: function (val, minLength) {
			return val.length >= minLength;
		}
	};

	rules.maxLength = {
		message: 'Please enter no more than {0} characters.',

		validate: function (val, maxLength) {
			return val.length <= maxLength;
		}
	};

	rules.pattern = {
		message: 'Please enter valid value.',

		validate: function (val, regex) {
			return regex.test(val);
		}
	};

	rules.step = {
		message: 'The value must increment by {0}',

		validate: function (val, step) {

			// in order to handle steps of .1 & .01 etc.. Modulus won't work
			// if the value is a decimal, so we have to correct for that
			if (step === 'any') { return true; }
			var dif = (val * 100) % (step * 100);
			return Math.abs(dif) < 0.00001 || Math.abs(1 - dif) < 0.00001;
		}
	};

	rules.email = {
		message: 'Please enter a proper email address',

		validate: function (val) {
			return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(val);
		}
	};

	rules.date = {
		message: 'Please enter a proper date',

		validate: function (value) {
			return !/Invalid|NaN/.test(new Date(value));
		}
	};

	rules.dateISO = {
		message: 'Please enter a date in proper format (e.g. 2013-08-02).',

		validate: function (value) {
			return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
		}
	};

	rules.number = {
		message: 'Please enter a number',

		validate: function (value) {
			return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
		}
	};

	rules.digit = {
		message: 'Please enter a digit',

		validate: function (value) {
			return /^\d+$/.test(value);
		}
	};

	rules.phoneUS = {
		message: 'Please specify a valid phone number',

		validate: function (phoneNumber) {
			phoneNumber = String(phoneNumber).replace(/\s+/g, "");
			return phoneNumber.length > 9 && phoneNumber.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
		}
	};

	rules.equal = {
		message: 'Values must equal to {0}.',

		validate: function (val, otherValue) {
			return val === getValue(otherValue);
		}
	};

	rules.notEqual = {
		message: 'Please choose another value.',

		validate: function (val, otherValue) {
			return val !== getValue(otherValue);
		}
	};

	rules.minlength = rules.minLength;
	rules.maxlength = rules.maxLength;

	ko.validation.rules = rules;
})();