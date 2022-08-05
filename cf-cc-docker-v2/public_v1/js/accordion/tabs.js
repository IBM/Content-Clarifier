
$(document).ready(function () {

$('#bbc .accordion__title:first-child').addClass('active');

$('#abc .accordion__title:first-child').addClass('active');

$('#xyz .accordion__title:first-child').addClass('active');

//alert($(window).width());
if($(window).width() > 768){

// Hide all but first tab content on larger viewports
$('#bbc .accordion__content_input:not(:first)').hide();


// Activate first tab
$('#bbc .accordion__title:first-child').addClass('active');

} else {
  
// Hide all content items on narrow viewports
$('#bbc .accordion__content_input').hide();
};

if($(window).width() > 768){

// Hide all but first tab content on larger viewports
$('#abc .accordion__content:not(:first)').hide();


// Activate first tab
$('#abc .accordion__title:first-child').addClass('active');

} else {
  
// Hide all content items on narrow viewports
$('#abc .accordion__content').hide();
};


if($(window).width() > 768){

// Hide all but first tab content on larger viewports
$('#xyz .accordion__content:not(:first)').hide();


// Activate first tab
$('#xyz .accordion__title:first-child').addClass('active');

} else {
  
// Hide all content items on narrow viewports
$('#xyz .accordion__content').hide();
};

// Wrap a div around content to create a scrolling container which we're going to use on narrow viewports
$( ".accordion__content" ).wrapInner( "<div class='overflow-scrolling'></div>" );

// The clicking action

$('#bbc .accordion__title').on('click', function() {
$('#bbc  .accordion__content_input').hide();
$(this).next().show().prev().addClass('active').siblings().removeClass('active');
});

$('#abc .accordion__title').on('click', function() {
$('#abc  .accordion__content').hide();
$(this).next().show().prev().addClass('active').siblings().removeClass('active');
});

$('#xyz .accordion__title').on('click', function() {
$('#xyz  .accordion__content').hide();
$(this).next().show().prev().addClass('active').siblings().removeClass('active');
});

});

