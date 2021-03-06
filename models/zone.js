define(function() {
    var Zone = Backbone.Model.extend({
		defaults: {
			name: '',
			ordered: false,
			owner: false,
		},
        game: false,
        initialize: function(name, ordered) {
            this.set('name', name);
			this.set('ordered', ordered);
			this.set('contents', []);
        },
        place: function(card, mode) {
            switch (mode) {
                case 'bottom':
                    this.attributes.contents.push(card);
                    break;
                case 'shuffle': // shuffle
                    this.attributes.contents.push(card);
                    this.attributes.contents.shuffle();

                    break;
                default: // 'top'
                    this.attributes.contents.unshift(card);
            }

            // Right now we have tests relying on interactions between cards and zones 
            // not added to any game. This check is for them.
            if (this.game) { // Это теперь должно происходить по событиям change, так что выпилим
                this.game.getView().trigger('cardMoved', card, this, mode);
            }
        },
        setGame: function(engineInstance) {
             this.game = engineInstance;
        },
        setOwner: function(owner) {
            this.set('owner', owner);
        },
        getName: function() {
            return this.get('name');
        },
		draw: function() {
			if (this.get('contents').length > 0) {
				return this.attributes.contents.shift();
			}
		}

    });
    
    return Zone;
});