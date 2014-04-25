define([], function(){
	var Step = Backbone.Model.extend({
		name: '',
		mandate_actions: [],
		main: false,
		setMain: function(flag) {
			this.main = flag;
			return this;
		},
		initialize: function(name) {
			this.name = name;
		},
		isMain: function() {
			return this.main;
		},
		activate: function() {
			// Apply mandatory actions
			for (var i = 0; i <= this.mandate_actions.length; i++) {
				if (this.mandate_actions[i] && typeof this.mandate_actions[i] == 'function') {
					this.mandate_actions[i]();
				}
			}
		},
		addAction: function(action) {
			this.mandate_actions.push(action);
			return this;
		}
	});
	return Step;
});