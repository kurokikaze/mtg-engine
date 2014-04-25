define(function() {
	var Stack = Backbone.Model.extend({
		contents: [],
		pop: function() {
			return this.contents.pop();
		},

		put: function(spell) {
			this.contents.push(spell);
		},

		getContents: function() {
			return contents;
		}
	});
	
	return Stack;
});

