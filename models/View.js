var View = function(engine) {
    var handlers = [];
    this.on = function(event, callback) {
        if (!handlers[event]) {
            handlers[event] = [];
        }
        handlers[event].push(callback);
    };

    this.trigger = function(event, data) {
        if (handlers[event] && handlers[event].length > 0) {
            for (var handler_id = 0; handler_id < handlers[event].length; handler_id++) {
                handlers[event][handler_id].call(engine, data);
            }
        }
    };
    
    this.getGame = function() {
        return engine;
    };
};
