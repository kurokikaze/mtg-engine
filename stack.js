var stack_object = function() {
    var contents = [];

    this.pop = function() {
        var last_spell = contents.pop();
        return last_spell;
    }

    this.put = function(spell) {
        contents.push(spell);
    }

    this.getContents = function() {
        return contents;
    }
}

