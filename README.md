#Knockout Validation Modified

#### Modifications

* Rewrote `ko.validation.utils.getConfigOptions` method on non-recursive manner.
* Added method `utils.observablesOf` which returns list of observables in object.
* Renamed `validationElement` binding into `validationStyle`.
* Renamed `validationCore` binding into `exposeValidationResult`.
* Decreased binding's dependencies.
* Renamed `showAllMessages` into `markAsModified`.
* Renamed `isAnyMessageShown` into `isAnyInvalidModified`
* Renamed `ko.validation.group` into `ko.validation.model` and optimized its creation.
* Removed wrapping for `ko.applyBindings`: if someone wants to do so it can.
* `ko.validatableObservable` now doesn't accept view models.
* Fixed password confirmation issue in test-runner.
* Fixed all tests. Removed unnecessary ones.
* Optimized `validatable` extender: removed unnecessary methods and observables.
* Removed `clearError/setError`. Added instead `observable.error.clear` and `error` methods.
* Renamed `ko.validation.validateObservable` into `ko.validation.process`.
* Renamed `configuration.decorateElement` into `configuration.decorateInputElement`. Removed dependency on this option in `validationElement` binding.
* Fixed memory leaks with annonymous rules.
* Now errors list for validation model is throttled, so now it's changed only once even if few observables in model became invalid.
* Now observables which are not validatable can't be processed by validation bindings, error is thrown instead.
* Removed `setAttribute/hasAttribute/getAttribute` from utils.
* Rewrote `setDomData/getDomData` to use knockout domData object, so in this case data will be cleared when domNode is removed.
* Removed localizations if someone wants to localize translations he has to rewrite `ko.validation.formatMessage` function
* Refactored code.

A KnockoutJS Plugin for model and property validation

[![Build Status](https://travis-ci.org/Knockout-Contrib/Knockout-Validation.png)](https://travis-ci.org/Knockout-Contrib/Knockout-Validation)

Contributors:

* [Eric Barnard](https://github.com/ericmbarnard)
* [Steve Greatrex](https://github.com/stevegreatrex)
* [Andy Booth](https://github.com/andybooth)
* [Michal Poreba](https://github.com/michalporeba)
* and many others!

License: [MIT](http://www.opensource.org/licenses/mit-license.php)

###NuGet: [Knockout.Validation](http://nuget.org/packages/Knockout.Validation)

Tested in IE 6+, FF7, Chrome 15
##Getting Started
```javascript
//start using it!
var myValue = ko.observable().extend({ required: true });

//oooh complexity
var myComplexValue = ko.observable().extend({ 
                     required: true,
                     minLength: 3,
                     pattern: {
                          message: 'Hey this doesnt match my pattern',
                          params: '^[A-Z0-9].$'
                     }
                 });

//or chaining if you like that
var myComplexValue = ko.observable()

myComplexValue.extend({ required: true })
            .extend({ minLength: 3 })
            .extend({ pattern: {
                 message: 'Hey this doesnt match my pattern',
                 params: '^[A-Z0-9].$'
            }});

//want to know if all of your ViewModel's properties are valid?
var myViewModel = ko.validatedObservable({
   property1: ko.observable().extend({ required: true }),
   property2: ko.observable().extend({ max: 10 })
});

console.log(myViewModel.isValid()); //false

myViewModel().property1('something');
myViewModel().property2(9);

console.log(myViewModel.isValid()); //true

```
see more examples on the Fiddle: http://jsfiddle.net/ericbarnard/KHFn8/

##Native Validation Rules
**Required**:

```javascript
var myObj = ko.observable('').extend({ required: true });
```
**Min**:

```javascript
var myObj = ko.observable('').extend({ min: 2 });
```
**Max**:

```javascript
var myObj = ko.observable('').extend({ max: 99 });
```
**MinLength**:

```javascript
var myObj = ko.observable('').extend({ minLength: 3 });
```
**MaxLength**:

```javascript
var myObj = ko.observable('').extend({ maxLength: 12 });
```
**Email**:

```javascript
var myObj = ko.observable('').extend({ email: true });
```

... and [MANY MORE](https://github.com/Knockout-Contrib/Knockout-Validation/wiki/Native-Rules)

_Much thanks to the [jQuery Validation Plug-In](https://github.com/jzaefferer/jquery-validation) team for their work on many of the rules_
##Custom Validation Rules
####Custom Rules
Custom Rules can be created using the simple example below. All you need is to define a validator function and a default message. 
The validator function takes in the observable's value, and the `params` that you pass in with the `extend` method.

```javascript
ko.validation.rules['mustEqual'] = {
    validator: function (val, otherVal) {
        return val === otherVal;
    },
    message: 'The field must equal {0}'
};
ko.validation.registerExtenders();

//the value '5' is the second arg ('otherVal') that is passed to the validator
var myCustomObj = ko.observable().extend({ mustEqual: 5 });
```
Learn more about Custom Rules on the [WIKI](https://github.com/Knockout-Contrib/Knockout-Validation/wiki/Custom-Validation-Rules)

###Or Check out our [User-Contributed Custom Rules](https://github.com/Knockout-Contrib/Knockout-Validation/wiki/User-Contributed-Rules)!###

##HTML5 Validation Attributes

Required: `<input type="text" data-bind="value: myProp" required />`

Min: `<input type="text" data-bind="value: myProp" min="2" />`

Max: `<input type="text" data-bind="value: myProp" max="99" />`

Pattern: `<input type="text" data-bind="value: myProp" pattern="^[a-z0-9].*" />`

Step: `<input type="text" data-bind="value: myProp" step="3" />`

**Special Note, the 'MinLength' attribute was removed until the HTML5 spec fully supports it**

##Knockout Bindings

###ValidationMessage
If you want to customize the display of your objects validation message, use the `validationMessage` binding:

```html
<div>
   <input type="text" data-bind="value: someValue"/>
   <p data-bind="validationMessage: someValue"></p>
<div>
```
Check out more on [Validation Bindings](https://github.com/Knockout-Contrib/Knockout-Validation/wiki/Validation-Bindings)

##Remote Validation Rules
Check out our [Async Validation](https://github.com/Knockout-Contrib/Knockout-Validation/wiki/Async-Rules) and [jQuery AJAX Validation](https://github.com/ericmbarnard/Knockout-Validation/wiki/Async-Rules)

##Localization

Add a reference to the localization js file after the Knockout Validation plugin

```html
<script type="text/javascript" src ="knockout.validation.js"></script>
<script type="text/javascript" src ="el-GR.js"> </script>
```
