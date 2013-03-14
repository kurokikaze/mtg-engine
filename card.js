var card = function(img, name, type) {
    var location = 'library';
    var image = img;
    this.owner = false;
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
        this.trigger('etb');
        if (!this.is_land()) {
            this.tapped = true;
        }
        location = 'battlefield';

	// we're placing permanent on the battlefield,
	// but mark the card as placed there
        battlefield.place(card_permanent);
    };
    
    this.getGame = function() {
        return this.game;
    }

    return this;
};

