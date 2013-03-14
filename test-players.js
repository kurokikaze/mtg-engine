
var human_player = function() {
    var that = this;
    this.givePriority = function() {
        console.log('Human player got priority');
        var action_pass = $('<li/>').text('[Pass]').addClass('action');
        action_pass.on('click', function() {
            $('#actions').hide();
            that.trigger('pass');
            that.removeHandlers('pass');
            this.remove();
        });
        $("#actions").append(action_pass);
        $("#actions").show();
    }
}

human_player.prototype = new player;

var ai_player = function() {
    var that = this;
    this.givePriority = function() {
        console.log('AI player got priority');
        setTimeout(function() {
		    that.trigger('pass');
            that.removeHandlers('pass');
	    }, 100);
    }
}

ai_player.prototype = new player;

