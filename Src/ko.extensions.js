﻿ko.applyBindingsWithValidation = function (viewModel, rootNode, options) {
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

	ko.validation.init();

	if (config) {
		ko.validation.utils.setDomData(node, config);
	}

	ko.applyBindings(viewModel, rootNode);
};

ko.validatedObservable = function (initialValue) {
	return ko.observable(initialValue).extend({ validatable: true });
};
