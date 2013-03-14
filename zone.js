var zone = function(name, ordered, hidden) {
    var element = $('<div/>').attr('id', name + '_zone').addClass('zone');
    this.name = name;
    this.owner = false;
    element.append($('<h4/>').text(name).addClass('zoneName'));
    if (ordered) {
        element.addClass('zone-ordered');
    }
    if (hidden) {
        element.addClass('zone-hidden');
    }
    var that = this;
    $('div#zones').append(element);
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
        element.append(card.element);
    };
    this.contents = [];
    
    return this;
};

zone.prototype.getName = function() {
    return this.name;
}

zone.prototype.setOwner = function(owner) {
    this.owner = owner;   
}

