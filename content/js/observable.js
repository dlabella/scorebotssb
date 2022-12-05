function observable(val){
    var self=this;
    var value=val;
    var subscriptions = [];
    self.setValue = function(val){
        value=val;
        for(var subscription of subscriptions){
            subscription(val);
        }
    }
    self.getValue = function(){
        return val;
    }
    self.subscribe = function(delegate){
        subscriptions.push(delegate);
    }
    return self;
}