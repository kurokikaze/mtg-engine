define(function(){
    var Card = Backbone.Model.extend({
		defaults: {
			location: 'library',
			image: '',
			owner: false,
			types: [],
			subtypes: [],
			tapped: false,
			game: false,
		},
        cost: {
            'W': 0,
            'U': 0,
            'B': 0,
            'R': 0,
            'G': 0,
            'C': 0,
            'X': false
        },
        initialize: function(img, name, type) {
            this.set('img', img);
            this.set('name', name);
            this.setTypes(type);
        },
        setManaCost: function(new_cost) {
            if (new_cost.W) this.cost.W = new_cost.W;
            if (new_cost.U) this.cost.U = new_cost.U;
            if (new_cost.B) this.cost.B = new_cost.B;
            if (new_cost.R) this.cost.R = new_cost.R;
            if (new_cost.G) this.cost.G = new_cost.G;
            if (new_cost.C) this.cost.C = new_cost.C;
        },
        getManaCost: function() { 
            return this.cost;
        },
        setTypes: function(types) {
            this.types = types.split(' ');
        },
        hasType: function(type) {
            var result = _.find(this.types, function(el) { return el == type});
            return !!result;
        },
        setSubtypes: function(subtypes) {
            this.subtypes = subtypes.split(' ');
        },
        hasSubtype: function(subtype) {
            var result = _.find(this.subtypes, function(el) { return el == subtype});
            return !!result;
        },
        goLibrary: function(mode) {
            this.set('location', 'library');
            this.get('owner').library.place(this, mode);
        },

        goGraveyard: function(mode) {
            this.set('location', 'graveyard');
            this.get('owner').graveyard.place(this, mode);
        },

        goBattlefield: function() {
            if (this.get('location') != 'battlefield') {
                var card_permanent = new Permanent(this);
                //this.game.trigger('etb', this);
                if (this.hasType('Creature')) {
                    card_permanent.set('tapped', true);
                }
                this.set('location', 'battlefield');

                // we're placing permanent on the battlefield,
                // but mark the card as placed there
                this.get('owner').battlefield.place(card_permanent);
            }
        }

    });

    return Card;
});