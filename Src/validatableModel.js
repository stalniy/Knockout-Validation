(function (holder) {
  var utils = holder.utils;

  function ValidatableModel(observables, options) {
    this.each = makeIteratorFrom(ko.utils.arrayForEach, observables);
    this.find = makeIteratorFrom(ko.utils.arrayFirst, observables);
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
    options = ko.utils.extend(ko.utils.extend({}, holder.configuration.grouping), options);

    var observables = utils.observablesOf(model, ensureIsValidatable, options);

    return ko.utils.extend(new ValidatableModel(observables, options), model);
  };

})(ko.validation);