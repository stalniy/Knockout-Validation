ko.validation.utils = (function () {
	var seedId = new Date().getTime();

	var domData = ko.utils.domData;
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

			return options || ko.validation.configuration;
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
				return ko.utils.arrayForEach(object, callback);
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
				var values, val = ko.utils.unwrapObservable(obj);

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
			ko.utils.arrayForEach(ko.validation.configuration.html5Attributes, function (attr) {
				var value = element.getAttribute(attr);
				if (value !== null) {
					if (!isNaN(+value)) {
						value = Number(value);
					}
					ko.validation.addRule(observable, {
						rule: attr,
						params: !value && value !== 0 ? true : value
					});
				}
			});

			var type = element.type;
			ko.validation.addRule(observable, {
				rule: type === 'date' ? 'dateISO' : type,
				params: true
			});
		},

		// writes html5 validation attributes on the element passed in
		writeInputValidationAttributes: function (element, observable) {
			if (!utils.isValidatable(observable)) {
				return false;
			}

			var rules = observable.rules();
			var rulesMap = {};
			ko.utils.arrayForEach(rules, function (rule) {
				rulesMap[rule.rule.toLowerCase()] = rule;
			});

			// loop through the attributes and add the information needed
			ko.utils.arrayForEach(ko.validation.configuration.html5Attributes, function (attr) {
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
})();