function Log(){
    $(document.body).append('<ul class="log"></ul>');
    this.ul = $('.log');
}

Log.prototype.add = function(text){
    var li = $('<li>'+text+'</li>');
    li.hide();
    this.ul.append(li);
    li.fadeIn(200);
    setTimeout(function(){
        li.fadeOut(200, function(){
            $(this).remove();
        });
    }, 3000);
}