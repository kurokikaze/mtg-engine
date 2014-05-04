define([], function(){
	var Step = Backbone.Model.extend({
		name: '',
		defaults: {
			game: false,
		},
		mandate_actions: [],
		main: false,
		setMain: function(flag) {
			this.main = flag;
			return this;
		},
		initialize: function(name, game) {
			this.name = name;
			this.set('game', game);
		},
		isMain: function() {
			return this.main;
		},
		activate: function() {
			// Apply mandatory actions
			for (var i = 0; i <= this.mandate_actions.length; i++) {
				if (this.mandate_actions[i] && typeof this.mandate_actions[i] == 'function') {
					this.mandate_actions[i].call(this.get('game'));
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