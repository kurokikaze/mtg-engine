var permanent = function(source_card) {
	this.isToken = false;
	this.representedBy = false;
	this.tapped = false;
	
	this.handlers = {};

	if (source_card instanceof card) {
		this.representedBy = source_card;
	} else { // we're creating a token
		this.isToken = true;
		this.name = source_card.name;
		this.power = source_card.power;
		this.toughness = source_card.toughness; 
	}

	this.getName = function() {
		if (!this.isToken) {
			return this.representedBy.getName();
		} else {
			return this.name;
		}
	}
	return this;
}

permanent.prototype.isTapped = function() {
	return this.tapped;
};

permanent.prototype.tap = function() {
	if (!this.tapped) {
		this.tapped = true;
		this.trigger('tapped');
	} else {
		return false; // should throw something
	}
};

permanent.prototype.untap = function() {
	if (this.tapped) {
		this.tapped = false;
		this.trigger('untaps');
	}
};

permanent.prototype.getManaCost = function() {
	if (this.isToken) {
		return {
			'W':0,
			'U':0,
			'B':0,
			'R':0,
			'G':0,
			'C':0
		}
	} else {
		return this.representedBy.getManaCost();
	}
};

permanent.prototype.on = function(event, callback) {
    if (!this.handlers[event]) {
        this.handlers[event] = [];
    }
    this.handlers[event].push(callback);
}

permanent.prototype.trigger = function(event, data) {
    if (this.handlers[event] && this.handlers[event].length > 0) {
        for (var handler_id = 0; handler_id < this.handlers[event].length; handler_id++) {
            this.handlers[event][handler_id].call();
        }
    }
}

