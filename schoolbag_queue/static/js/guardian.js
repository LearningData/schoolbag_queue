$(".homework-time").each (function() {
		var time = parseInt($(this).text());
		time = moment.duration(time, "minutes").format("h [hr] m [mins]");
		$(this).text(time);
});

$( ".btn-collapse" ).click(function() {
  $( '.collapse-homework' ).slideToggle( "500" );
});

