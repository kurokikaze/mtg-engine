define(function() {
    var Zone = Backbone.Model.extend({
        name: '',
        owner: false,
        game: false,
        contents: [],
        initialize: function(name) {
            this.name = name;
        },
        place: function(card, mode) {
            switch (mode) {
                case 'bottom':
                    this.contents.push(card);
                    break;
                case 'shuffle': // shuffle
                    this.contents.push(card);
                    this.contents.shuffle();

                    break;
                default: // 'top'
                    this.contents.unshift(card);
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
            this.owner = owner;
        },
        getName: function() {
            return this.name;
        }

    });
    
    return Zone;
});