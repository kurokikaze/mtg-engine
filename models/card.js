var card = function(img, name, type) {
    var location = 'library';
    var image = img;
    this.owner = false;
    this.subtypes = [];
    this.element = $('<div/>').css('background-image','url("' + img + '")').attr('title', name).addClass('card');
    this.tapped = false;
    this.game = false;
    
    var that = this;
    this.cost = {
	'W':0,
	'U':0,
	'B':0,
	'R':0,
	'G':0,
	'C':0
    }
    
    this.setManaCost = function(new_cost) {
        if (new_cost.W) this.cost.W = new_cost.W;
        if (new_cost.U) this.cost.U = new_cost.U;
        if (new_cost.B) this.cost.B = new_cost.B;
        if (new_cost.R) this.cost.R = new_cost.R;
        if (new_cost.G) this.cost.G = new_cost.G;
        if (new_cost.C) this.cost.C = new_cost.C;
    }

    this.setOwner = function(owner) {
		if (owner instanceof player) {
			this.owner = owner;
		}
    }

    this.setGame = function(game) {
		this.game = game;
    }

    this.setTypes = function(types) {
        this.types = types.split(' ');
    }

    this.getTypes = function() {
        return this.types;
    }

    this.hasType = function(type) {
        for (var i in this.types) {
            if (this.types.hasOwnProperty(i)) {
                if (this.types[i] == type) {
                    return true;
                }
            }
        }
        return false;
    }

    this.setSubtypes = function(subtypes) {
        this.subtypes = subtypes.split(' ');
    }

    this.getSubtypes = function() {
        return this.subtypes;
    }

    this.hasSubtype = function(subtype) {
        for (var i in this.subtypes) {
            if (this.subtypes.hasOwnProperty(i)) {
                if (this.subtypes[i] == subtype) {
                    return true;
                }
            }
        }
        return false;
    }

    this.getOwner = function() {
	    return this.owner;
    }

    this.getManaCost = function() {
	    return this.cost;
    }

    this.getName = function() {
	    return name;
    }
	
    this.goLibrary = function(mode) {
        location = 'library';
        this.owner.library.place(that, mode);
    };
    
    this.goGraveyard = function(mode) {
        location = 'graveyard';
        this.owner.graveyard.place(that, mode);
    };
    
    this.goBattlefield = function() {
		var card_permanent = new permanent(this);
        //this.game.trigger('etb', this);
        if (this.hasType('Creature')) {
            card_permanent.tapped = true;
        }
        location = 'battlefield';

	    // we're placing permanent on the battlefield,
	    // but mark the card as placed there
        this.owner.battlefield.place(card_permanent);
    };
    
    this.getGame = function() {
        return this.game;
    }

    this.types = this.setTypes(type);
    
    return this;
};

