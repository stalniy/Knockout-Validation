ko.validation.utils = (function () {
	var domData = ko.utils.domData;
	var domDataKey = '__ko_validation__';

	var utils = {
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
					if (context) {
						return context;
					}
					if (!checkOnlyNode && node.parentNode) {
						return utils.contextFor(node.parentNode);
					}
					break;
			}
			return undefined;
		},

		getOriginalElementTitle: function (element) {
			var savedOriginalTitle = element.getAttribute('data-orig-title'),
				hasSavedOriginalTitle = savedOriginalTitle !== null;

			return hasSavedOriginalTitle ? savedOriginalTitle : element.title;
		}
	}

	return utils;
})();
