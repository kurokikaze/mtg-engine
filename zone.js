 var zone = function(name, ordered, hidden) {
    this.name = name;
    this.owner = false;
    var game = false;
    var that = this;
    this.contents = [];

    this.place = function(card, mode) {
        switch (mode) {
            case 'bottom':
                that.contents.push(card);
                break;
            case 'shuffle': // shuffle
                that.contents.push(card);
                that.contents.shuffle();
                
                break;
            default: // 'top'
                that.contents.unshift(card);
        }
        
        // Right now we have tests relying on interactions between cards and zones 
        // not added to any game. This check is for them.
        if (game) {
            game.getView().trigger('cardMoved', card, that, mode);
        }
    };
    
    this.setGame = function(engineInstance) {
        game = engineInstance;
    }    

    return this;
};



zone.prototype.getName = function() {
    return this.name;
}

zone.prototype.setOwner = function(owner) {
    this.owner = owner;   
}

