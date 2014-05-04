define(['/models/zone.js'], function(Zone) {
	var Stack = Zone.extend({
		initialize: function() {
			Zone.prototype.initialize.call(this);
			this.set('name', 'Stack');
			this.set('ordered', true);
		},
		pop: function() {
			return this.attributes.contents.pop();
		},

		put: function(spell) {
			this.attributes.contents.push(spell);
		},

		getContents: function() {
			return this.get('contents');
		}
	});
	
	return Stack;
});

