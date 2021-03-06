﻿// The core binding handler
// this allows us to setup any value binding that internally always
// performs the same functionality
ko.bindingHandlers.exposeValidationResult = (function () {
	return {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var config = ko.validation.utils.getConfigOptions(element);
			var observable = valueAccessor();

			// parse html5 input validation attributes, optional feature
			if (config.parseInputAttributes) {
				ko.validation.utils.async(function () {
					ko.validation.utils.parseInputValidationAttributes(element, observable);
				});
			}

			if (!ko.validation.utils.isValidatable(observable)) {
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

			// write the html5 attributes if indicated by the config
			if (config.writeInputAttributes) {
				ko.validation.utils.writeInputValidationAttributes(element, observable);
			}

			// if requested, add binding to decorate element
			if (config.decorateInputElement) {
				ko.applyBindingsToNode(element, { validationStyle: observable });
			}
		}
	};

}());

// override for KO's default 'value' and 'checked' bindings
ko.validation.makeBindingHandlerValidatable("value");
ko.validation.makeBindingHandlerValidatable("checked");


ko.bindingHandlers.validationMessage = { // individual error message, if modified or post binding
	update: function (element, valueAccessor) {
		var observable = valueAccessor();

		if (!ko.validation.utils.isValidatable(observable)) {
			throw new Error("Observable is not validatable");
		}

		var
			config = ko.validation.utils.getConfigOptions(element),
			state  = observable.validationState();

		var error = null, shouldShowError = false;
		if (!config.messagesOnModified || state.isModified) {
			error = state.isValid ? null : state.error;
			shouldShowError = !state.isValid;
		}

		if (shouldShowError) {
			ko.bindingHandlers.text.update(element, function () { return error; });
		}
		ko.bindingHandlers.validationMessage.toggleErrorVisibility(element, shouldShowError);
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

ko.bindingHandlers.validationStyle = {
	update: function (element, valueAccessor) {
		var observable = valueAccessor();

		if (!ko.validation.utils.isValidatable(observable)) {
			throw new Error("Observable is not validatable");
		}

		var
			config = ko.validation.utils.getConfigOptions(element),
			state  = observable.validationState();

		//add or remove class on the element;
		ko.bindingHandlers.css.update(element, function () {
			var classes = {};
			classes[config.errorElementClass] = !config.decorateElementOnModified || state.isModified ? !state.isValid : false;

			return classes;
		});

		if (config.errorsAsTitle) {
			ko.bindingHandlers.validationStyle.setErrorAsTitleOn(element, observable, config);
		}
	},

	setErrorAsTitleOn: function (element, observable, config) {
		var state = observable.validationState();

		ko.bindingHandlers.attr.update(element, function () {
			var title = ko.validation.utils.getOriginalElementTitle(element);
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
ko.bindingHandlers.validationOptions = {
	init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		var options = ko.utils.unwrapObservable(valueAccessor());
		if (options) {
			var newConfig = ko.utils.extend({}, ko.validation.configuration);
			ko.utils.extend(newConfig, options);

			//store the validation options on the node so we can retrieve it later
			ko.validation.utils.setDomData(element, newConfig);
		}
	}
};

