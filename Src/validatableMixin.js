function isValidatable(observable) {
  return observable && ko.isObservable(observable.error) && ko.isObservable(observable._validators);
}

ko.validation.mixin = (function () {
  var each = ko.utils.arrayForEach;
  var extend = ko.utils.extend;

  function makeValidatable(observable) {
    observable._validators = ko.observableArray([]);
    observable.error = ko.observable(null);
    observable.isValid = isValid;
  };

  function isValid() {
    return this.error() === null;
  }

  function extractFieldsFrom(object, fields) {
    var result = {};

    each(fields, function (field) {
      if (field in object) {
        result[field] = object[field];
        delete object[field];
      }
    });

    return result;
  }

  function getValidator(name, validators, defaults) {
    var validator = validators[name];

    if (typeof validator !== "object" || validator === null) {
      var validatorOptions = extend({}, defaults);
      validatorOptions.value = validator;
      validator = validatorOptions;
    } else {
      tkt.mixinIfUndefined(validator, defaults);
    }

    validator.name = name;

    return validator;
  }

  function extractValidationArguments(list) {
    var args = Array.prototype.slice.call(list, 0);
    var possibleValidators = args.pop();
    var validators = possibleValidators;

    if (typeof possibleValidators === "function") {
      validators = typeof args[args.length - 1] === "object" ? args.pop() : {};
      validators.validate = possibleValidators;
    }

    return {
      options    : extractFieldsFrom(validators, ['message', 'onlyIf']),
      fields     : pathsToValues(args),
      validators : validators
    };
  }

  function recursiveEach(list, callback) {
    var i = -1;
    var count = list.length;

    function next() {
      if (i++ < count) {
        callback(list[i], next);
      }
    };

    next();
  }

  function addValidatedFieldTo(object, field) {
    if (!object._validatedFieldNames[field.name]) {
      object._validatedFieldNames[field.name] = true;
      object._validatedFields.push(field);
    }
  }

  function pathsToValues(paths, holder) {
    var values = [];

    each(paths, function (path) {
      var loc = tkt.valueLocationIn(holder, path);
      values.push(loc.cursor[loc.field]);
    });

    return values;
  }


  return {

    setUp: function () {
      this._validatedFields = [];
      this._validatedFieldNames = {};
    },

    validates: function (/* pathToObservable1, pathToObservable2, ..., validators*/) {
      var self = this;
      var args = extractValidationArguments(arguments);

      for (var name in args.validators) {
        var validator = getValidator(name, args.validators, args.options);

        each(args.fields, function (observable) {
          if (!isValidatable(observable)) {
            makeValidatable(observable);
          }
          addValidatedFieldTo(this, { name: path, value: observable });
          observable._validators.push(validator);
          self._addValidationHandlerFor(observable);
        });
      }

      return self;
    },

    _addValidationHandlerFor: function (observable) {
      var self = this;

      observable._validationHandler = ko.computed(function () {
        self._validate(observable);
      });
      observable._validationHandler.throttleEvaluation = 5;
    },

    _validate: function (observable) {
      var self = this;
      var value = observable();

      recursiveEach(observable._validators(), function (validator, next) {
        if (!validator.validate && validator.name in validators) {
          tkt.mixIfUndefined(validator, ko.validation.rules[validator.name]);
        }

        if (!validator.validate) {
          throw new Error("Unable to process validation for params: " + ko.toJSON(validator));
        }

        var validatorValue = ko.utils.unwrapObservable(validator.value);
        var isValid =  === false ||
          validator.mandatory && tkt.isValueBlank(value) ||
          validator.validate(value, validatorValue);

        if (!isValid) {
          observable.error(validator.message);
        } else if (typeof isValid === "object" && isValid.promise) {
          //TODO: implement _beforeValidation hook
          result.done(function (result) {
            if (result.isValid) {
              observable.error(null);
              next();
            } else {
              observable.error(result.message || validator.message);
            }
          });
        } else {
          observable.error(null);
          next();
        }
      });
    },

    _isValid: function (fieldPath) {
      var isValid = true;
      var isValidated = false;
      var validatedFields = this._validatedFields;

      for (var i = 0, count = validatedFields.length; i < count && isValid; i++) {
        var field = validatedFields[i];
        if (field.name.indexOf(fieldPath) === 0) {
          isValidated = true;
          isValid = field.value.isValid();
        }
      }

      if (isValidated === false) {
        throw new Error("Unable to check validity of field: " + fieldPath);
      }

      return isValid;
    },

    _dispose: function () {
      each(this._validatedFields, function (field) {
        if (field.value._validationHandler) {
          field.value._validationHandler.dispose();
        }
        tkt.removeFieldsIn(field.value, ['error', '_validationHandler', '_validators']);
      });
      this._validatedFields.length = 0;
      this._validatedFieldNames = null;
    }
  };
});