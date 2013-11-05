asyncTest('Async test 1', 1, function() {
    setTimeout(function(){
        equal(1,1, 'Done!');
        //start();
    })
});

asyncTest('Async test 2', 1, function() {
    setTimeout(function(){
        equal(2, 2, 'Done (2)!');
        //start();
    })
});
