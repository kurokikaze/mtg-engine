var step = function(name) {
    this.name = name;
    this.mandate_actions = [];
    this.activate = function() {
        // Apply mandatory actions
        for (var i = 0; i <= this.mandate_actions.length; i++) {
            if (this.mandate_actions[i] && typeof this.mandate_actions[i] == 'function') {
                this.mandate_actions[i]();
            }
        }
    };
};

step.prototype.addAction = function(action) {
    this.mandate_actions.push(action);
    return this;
}
