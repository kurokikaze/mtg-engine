var spell = function(source) {
    this.effect = false;
    this.representedBy = false;
    this.targeting = false;
    if (source instanceof card) {
		this.representedBy = source;
    } else {
		this.name = source.name;
		this.effect = source.effect;
		this.owner = source.owner;
		if (source.cost) this.cost = source.cost;
    }
    return this;
}

spell.prototype.getOwner = function() {
    if (this.representedBy) {
	    return this.representedBy.getOwner();
    } else {
	    return this.owner;
    }
}

spell.prototype.cast = function(caster) {
    if (!caster) caster = this.getOwner();
    this.caster = caster;
    if (this.targeting) {
		validTargets = this.targeting();
		if (validTargets.length == 0) {
			return false; // Cannot cast without available targets
		}
    }
    var game = this.representedBy.getGame();
};

spell.prototype.resolve = function() {
    if (this.targeting && this.targeting().length == 0) {
	return false; // Spell with no valid target is countered on resolution
    } else {
		// actual effects
    }
	

	if (this.representedBy) {
		this.representedBy.goGraveyard();
	}
};
