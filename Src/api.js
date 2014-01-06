var api = (function () {
	var isInitialized = false;
	var configuration = ko.validation.configuration;
	var utils = ko.validation.utils;

	function initValidationFor(element, valueAccessor) {
		var config = ko.validation.utils.getConfigOptions(element);
		var observable = valueAccessor();

		if (!isValidatable(observable)) {
			return false;
		}

		if (config.insertMessages) {
			var messageNode = ko.validation.insertValidationMessage(element);
			if (config.messageTemplate) {
				ko.renderTemplate(config.messageTemplate, { field: observable }, null, messageNode, 'replaceNode');
			} else {
				ko.applyBindingsToNode(messageNode, { validationMessage: observable });
			}
		}

		// if requested, add binding to decorate element
		if (config.decorateInputElement) {
			ko.applyBindingsToNode(element, { validationStyle: observable });
		}
	}

	return {
		//Call this on startup
		//any config can be overridden with the passed in options
		init: function (options, force) {
			//done run this multiple times if we don't really want to
			if (isInitialized && !force) {
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

			isInitialized = true;
		},

		//creates a span next to the @element with the specified error class
		insertValidationMessage: function (element) {
			var span = document.createElement('SPAN');
			span.className = utils.getConfigOptions(element).errorMessageClass;
			element.parentNode.insertBefore(span, element.nextSibling);
			return span;
		},

		//take an existing binding handler and make it cause automatic validations
		makeBindingHandlerValidatable: function (handlerName) {
			var init = ko.bindingHandlers[handlerName].init;

			ko.bindingHandlers[handlerName].init = function () {
				initValidationFor.apply(this, arguments)
				return ko.bindingHandlers.exposeValidationResult.init.apply(this, arguments);
			};
		}
	};

})();

// expose api publicly
ko.utils.extend(ko.validation, api);