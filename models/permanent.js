define(['/models/card.js'], function(Card) {
	var Permanent = Backbone.Model.extend({
		initialize: function(source_card) {
			if (source_card instanceof Card) {
				this.set('representedBy', source_card);
			} else { // we're creating a token
				this.set('isToken', true);
				this.set('name', source_card.name);
				this.set('power', source_card.power);
				this.set('toughness', source_card.toughness); 
			}
		},
		defaults: {
			isToken: false,
			representedBy: false,
			tapped: false
		},
		getName: function() {
			if (!this.get('isToken')) {
				return this.get('representedBy').get('name');
			} else {
				return this.name;
			}
		},
		isTapped: function() {
			return this.get('tapped');
		},
		tap: function() {
			this.set('tapped', true);
		},
		untap: function() {
			this.set('tapped', false);
		},
		getManaCost: function() {
			if (this.get('isToken')) {
				return {
					'W':0,
					'U':0,
					'B':0,
					'R':0,
					'G':0,
					'C':0
				}
			} else {
				return this.get('representedBy').getManaCost();
			}	
		}
	});

	return Permanent;
});