$(document).ready(function() {


	$('#navwrapper').css('top', $('header').height());

    // For the Second level Dropdown menu, highlight the parent
    $( ".dropdown-menu" )
    .mouseenter(function() {
        $(this).parent('li').addClass('active-gray');
    })
    .mouseleave(function() {
        $(this).parent('li').removeClass('active-gray');
    });

   	$('[data-tab]').hover(function() {
	   	var tab_id = $(this).data('tab');
	   	var block = tab_id.substring(1,tab_id.lastIndexOf('_'));
	   	$('.tab-pane').each(function() {
			if ($(this).attr('id').indexOf(block) == 0) {
				$(this).removeClass('active');
			}
		});
	   	$(tab_id).addClass('active');
	});

	$('[data-tab]').click(function(e) {
		var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;
		if (supportsTouch) e.preventDefault();
	   	var tab_id = $(this).data('tab');
	   	var block = tab_id.substring(1,tab_id.lastIndexOf('_'));
	   	$('.tab-pane').each(function() {
			if ($(this).attr('id').indexOf(block) == 0) {
				$(this).removeClass('active');
			}
		});
	   	$(tab_id).addClass('active');
		var clicked = $(this).data('clicked');
	   	if (clicked) {
		   	var url = $(this).attr('href');
		   	window.location.href = url;
	   	} else {
		   	$(this).data('clicked',true);
	   	}
	});

	$('.dropdown-submenu a').on('click',function(e) {
		var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;
		var url = $(this).data('url');
		$(this).attr('href', url);
		if (!supportsTouch && e.which == 1) {
			window.location.href = url;
		} else if (supportsTouch && $(window).width() < 728) {
			window.location.href = url;
		};
	});

	$('.newsticker').css({ display: "block" });
	$('.newsticker').newsTicker({
		max_rows:		1,
		row_height:		20,
		duration:		5000,
		speed:			250,
		prevButton:		$('.backward'),
	    nextButton:		$('.forward')
	});

	$('[data-toggle="tab"]').bind('click', function() {
		var list_view = $(this).attr('aria-controls');
		$('#list_view').val(list_view);
	});

	if ($('#list_view').val() == 'headlines') {
		$('#list a[href="#headlines"]').tab('show');
	} else {
		$('#list a[href="#summaries"]').tab('show');
	}
	if ($('#saved_summaries').val()) {
		$('#summaries').empty().append($('#saved_summaries').val());
	}
	if ($('#saved_headlines').val()) {
		$('#headlines').empty().append($('#saved_headlines').val());
	}

	var excluded = $('#excluded_filenames').val();

	function uniqueId() { return new Date().getTime(); };

	$.ajaxSetup ({
	    // Disable caching of AJAX responses
	    cache: false
	});

	$('#load_more_stories').on('click', function () {

		var category = $('meta[name=top]').attr("content");
		var section = $('meta[name=section]').attr("content");
		var topic = $('meta[name=topic]').attr("content");
		var quirky = $('meta[name=quirky]').attr("content");

		var hash = window.location.hash.slice(1);
		var array = hash.split("&");
		var values, form_data = {};
		for (var i = 0; i < array.length; i += 1) {
		    values = array[i].split("=");
		    form_data[values[0]] = values[1];
		}

		var page = form_data['page'] || 1;
		var summaries_start = (page * 20);
		var summaries_end = summaries_start + 20;
		var headlines_start = (page * 100);
		var headlines_end = headlines_start + 100;

		var btn = $(this);
		btn.button('loading');

		if ($('#summaries').hasClass('active')) {
			$('#summaries').append( $('<div>').load(
				'/xml/summaries.php?top=' + category + '&quirky=' + quirky + '&section=' + section + '&topic=' + topic + '&exclude=' + excluded + '&start=' + summaries_start + '&end=' + summaries_end + '&page=' + page + '&uid=' + uniqueId(),
				function() {
					$('#saved_summaries').val($('#summaries').html());
				    btn.button('reset');
				}
			) );
			$('#list_view').val('summaries');
		} else if ($('#headlines').hasClass('active')) {
			$('#headlines').append( $('<div>').load(
				'/xml/headlines.php?top=' + category + '&quirky=' + quirky + '&section=' + section + '&topic=' + topic + '&exclude=' + excluded + '&start=' + headlines_start + '&end=' + headlines_end + '&page=' + page + '&uid=' + uniqueId(),
				function() {
					$('#saved_headlines').val($('#headlines').html());
				    btn.button('reset');
				}
			) );
			$('#list_view').val('headlines');
		}

		page++;
		window.location.hash = 'page=' + page;

	});

	$('.print').on('click', function() {
		$('.main').print({
			prepend: $('.logo').html() + '<br />' + '<style>.main {width: 100% !important} .photo-image {float: left; max-width: 300px; padding: 15px 25px 15px 0} .photo-image img {max-height: 300px !important; width: auto}</style>'
		});
	});

	$(".navbar-collapse").css({ maxHeight: $(window).height() - $(".navbar-header").height() + "px" });
	$(".dropdown-menu").css({ maxWidth: $('.main').width() + "px" });

	if ($(window).width() > 480) {
	   $('#viewport').remove();
	}

});

$(function () {
	var title = $("meta[property='og:title']").attr("content");
	var summary = $("meta[property='og:description']").attr("content");
	var url = $("meta[property='og:url']").attr("content");
	$('.email').on('click', function (event) {
		event.preventDefault();
		window.location = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(title + "\n" + url + "\n\n" + summary + "\n");
	});
	var modal = ' \
	<!-- Modal --> \
	<div class="modal fade" id="shareModal" tabindex="-1" role="dialog" aria-labelledby="shareModalLabel"> \
	  <div class="modal-dialog" role="document"> \
	    <div class="modal-content"> \
	      <div class="modal-header"> \
	        <h4 class="modal-title" id="myModalLabel">Share this page ...</h4> \
	      </div> \
	      <div class="modal-body"> \
	      	<div> \
	      		<strong>' + title + '</strong><br /> \
	      		<a href="' + url + '">' + url + '</a> \
	      	</div> \
	      	<div style="margin: 10px 0 15px 0">' + summary + '</div> \
			<div data-url="' + url + '" class="ssk-group"> \
			    <a class="ssk ssk-facebook"></a> \
			    <a class="ssk ssk-twitter"></a> \
			    <a class="ssk ssk-google-plus"></a> \
			    <a class="ssk ssk-pinterest"></a> \
			    <a class="ssk ssk-linkedin"></a> \
			</div> \
	      </div> \
	      <div class="modal-footer"> \
	        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> \
	      </div> \
	    </div> \
	  </div> \
	</div> \
	';
	$('footer').append(modal);
});

$(function () {
	var mytitle = $("meta[property='og:title']").attr("content");
	var myurl = $("meta[property='og:url']").attr("content");
	SocialShareKit.init({
	    url: myurl,
	    title: mytitle,
	    twitter: {
	        url: myurl,
	        text: ''
	    }
	});
});
