define(['/models/card.js'], function(Card) {
	var Spell = Backbone.Model.extend({
		defaults: {
			effect: false,
			representedBy: false,
			targeting: false,
		},
		initialize: function(source){
			if (source instanceof Card) {
				this.set('representedBy', source);
			} else {
				this.set('name', source.name);
				this.set('effect', source.effect);
				this.set('owner', source.owner);
				if (source.get('cost')) this.set('cost', source.get('cost'));
			}
		},
		getOwner: function() {
			if (this.get('representedBy')) {
				return this.get('representedBy').get('owner');
			} else {
				return this.get('owner');
			}
		},
		cast: function(caster) {
			if (!caster) caster = this.getOwner();
			this.set('caster', caster);
			if (this.get('targeting')) {
				var validTargets = this.targeting();
				if (validTargets.length == 0) {
					return false; // Cannot cast without available targets
				}
			}
			var game = this.get('representedBy').getGame();
		},
		resolve: function() {
			if (this.get('targeting') && this.targeting().length == 0) {
				return false; // Spell with no valid target is countered on resolution
			} else {
				// actual effects
			}

			if (this.get('representedBy')) {
				this.get('representedBy').goGraveyard();
			}
		}
	});
	
	return Spell;
});