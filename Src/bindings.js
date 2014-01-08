ko.validation.makeBindingHandlerValidatable("value");
ko.validation.makeBindingHandlerValidatable("checked");


ko.bindingHandlers.validationMessageFor = {
  update: function (element, valueAccessor) {
    var observable = valueAccessor();

    if (!isValidatable(observable)) {
      throw new Error("Observable is not validatable");
    }

    var
      binding = ko.bindingHandlers.validationMessageFor,
      config = ko.validation.utils.getConfigOptions(element);

    ko.bindingHandlers.text.update(element, function () { return binding.formatErrorOf(observable); });
    binding.toggleErrorVisibility(element, !!error);
  },

  toggleErrorVisibility: function (element, shouldShow) {
    var isCurrentlyErrorVisible = element.style.display !== "none";
    if (isCurrentlyErrorVisible && !shouldShow) {
      element.style.display = 'none';
    } else if (!isCurrentlyErrorVisible && shouldShow) {
      element.style.display = '';
    }
  },

  formatErrorOf: function (observable) {
    var failedRule = observable.failedRule();
    var error = observable.error();

    return observable.isValid() ? null : error.replace(/\{0\}/g, ko.utils.unwrapObservable(failedRule.value));
  }
};

ko.bindingHandlers.validationStyle = {
  update: function (element, valueAccessor) {
    var observable = valueAccessor();

    if (!isValidatable(observable)) {
      throw new Error("Observable is not validatable");
    }

    var
      config = ko.validation.utils.getConfigOptions(element),
      isValid  = observable.isValid();

    //add or remove class on the element;
    ko.bindingHandlers.css.update(element, function () {
      var classes = {};
      classes[config.errorElementClass] = !isValid;

      return classes;
    });

    if (config.errorsAsTitle) {
      ko.bindingHandlers.validationStyle.setErrorAsTitleOn(element, observable, config);
    }
  },

  setErrorAsTitleOn: function (element, observable, config) {
    var isValid = observable.isValid();

    ko.bindingHandlers.attr.update(element, function () {
      var title = ko.validation.utils.getOriginalElementTitle(element);

      if (!isValid) {
        return { title: observable.error, 'data-orig-title': title };
      } else {
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
  init: function (element, valueAccessor) {
    var options = ko.utils.unwrapObservable(valueAccessor());
    if (options) {
      var newConfig = ko.utils.extend({}, configuration);
      ko.utils.extend(newConfig, options);

      //store the validation options on the node so we can retrieve it later
      ko.validation.utils.setDomData(element, newConfig);
    }
  }
};

