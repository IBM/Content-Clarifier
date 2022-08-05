"use strict";
//(function(){
  var aashuApp = angular.module('aashuApp', ['slickCarousel', 'ngSanitize']);
  aashuApp.controller('initAashuAppPage', function($scope, $http, $sce) {
    /* Slick nav buttons */
    var prevArrow = '<button type="button" class="depth-xl-hover slick-prev">\n\
    <i class="fa fa-arrow-left" aria-hidden="true"><span class="sr-only">Previous</span></i>\n\
    </button>';

    var nextArrow = '<button type="button" class="depth-xl-hover slick-next">\n\
    <i class="fa fa-arrow-right" aria-hidden="true"><span class="sr-only">Next</span></i>\n\
    </button>';
    
    /* Page */
    $http.get("public/data/page.json").then(function(response) {
      $scope.page = response.data;
      $scope.page.themeColor = "public/css/color-" + $scope.page.themeColor + ".css";
      $scope.gmapSrc = "//maps.googleapis.com/maps/api/js?key=" + $scope.page.gmapKey;
    });

    /* Mega slider */
    $http.get("public/data/megaslider.json").then(function(response) {
      $scope.megaslider = response.data;
      $scope.megaslider.slickConfig = {
        fade: true,
        prevArrow: prevArrow,
        nextArrow: nextArrow,
        autoplay: true
      };
    });

    /* Navbar */
    $http.get("public/data/navbar.json").then(function(response) {
      $scope.navbar = response.data;
    });

    /* Navbareditor */
    $http.get("public/data/navbareditor.json").then(function(response) {
      $scope.navbareditor = response.data;
    });

    /* Features */
    $http.get("public/data/features.json").then(function(response) {
      $scope.features = response.data;
    });

    /* Video */
    $http.get("public/data/video.json").then(function(response) {
      $scope.video = response.data;
    });

    /* Screenshots */
    $http.get("public/data/screenshots.json").then(function(response) {
      $scope.screenshots = response.data;
      $scope.screenshots.slickConfig = {
        centerMode: true,
        infinite: true,
        slidesToShow: 5,
        autoplay: true,
        variableWidth: true,
        prevArrow: prevArrow,
        nextArrow: nextArrow
      };
    });

    /* Testimonials */
    $http.get("public/data/testimonials.json").then(function(response) {
      $scope.testimonials = response.data;
      $scope.testimonials.slickConfig = {
        infinite: true,
        autoplay: false,
        prevArrow: prevArrow,
        nextArrow: nextArrow
      };
    });

    /* Downloads */
    $http.get("public/data/downloads.json").then(function(response) {
      $scope.downloads = response.data;
    });

    /* Pricing */
    $http.get("public/data/pricing.json").then(function(response) {
      $scope.pricing = response.data;
    });

     /* Contact */
    $http.get("public/data/contact.json").then(function(response) {
      $scope.contact = response.data;
      var $contactItems = $scope.contact.items;
      (function($){
        //$(window).load(function(){ // added by sushank
          loadScript($scope.gmapSrc, function() {
            var map = $scope.gmapMarker({
              zoom: 8,
              scrollwheel: false,
              center: {lat: $contactItems.map.lat, lng: $contactItems.map.lng}
            }, $contactItems.address, $(".map"));
          });
        //}); //added by sushank
      })(jQuery);
    });
    $scope.contactResponse = {};
    $scope.contactSubmit = function() {
      $http({
        method: 'POST',
        url: 'php/index.php?action=contact',
        data: $scope.contactModel,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      })
              .then(function(response) {
        $scope.contactResponse = response.data;
      });
    }

    /* Subscribe */
    $http.get("public/data/subscribe.json").then(function(response) {
      $scope.subscribe = response.data;
    });
    $scope.subscribeResponse = {};
    $scope.subscribeSubmit = function() {
      $scope.successMessage="";

      $http({
        method: 'POST',
        url: '/create-user',
        data: {
		"id":$scope.subscribeModel.email,
		"fullName":$scope.subscribeModel.fullname
		},
        headers: {'Content-Type': 'application/json'}
      }).then(function(response) {
         
	   
          var response2 = JSON.stringify(response);
          
		
      
        $scope.subscribeResponse = response;
        if(response.data =="exists"){
          
           $scope.successMessage="USER ALREADY EXISTS! TO PROCEED &nbsp; &nbsp; <a class='btn btn-lg btn-white btn-round-lg depth-xl-hover'  href='/sso'>Login NOW</a> "
        }else if(response.data =="success"){
	   $scope.successMessage=" SUCCESS! TO PROCEED, CLICK &nbsp; &nbsp;<a class='btn btn-lg btn-white btn-round-lg depth-xl-hover'  href='/sso'>LAUNCH APP NOW</a>"
        }
        
      });
    }

    /* Footer */
    $http.get("public/data/footer.json").then(function(response) {
      $scope.footer = response.data;
    });

    /* Youtube embed URL */
    $scope.youtubeEmbedUrl = function(vid) {
      return $sce.trustAsResourceUrl("//www.youtube.com/embed/" + vid + "?autoplay=0");
    };

    /* gMap */
    $scope.gmapMarker = function(mapOptions, address, element) {
      var map = new google.maps.Map(element.get(0), mapOptions);
      var marker = new google.maps.Marker({
        position: mapOptions.center,
        map: map,
        title: 'Contact center',
        icon: 'images/blank.png',
        label: {
          fontFamily: 'Fontawesome',
          text: '\uf041',
          color: $(".btn-solid").css("background-color"),
          fontSize: '48px'
        }
      });
      var infowindow = new google.maps.InfoWindow({
        content: address
      });
      marker.addListener('click', function() {
        infowindow.open(map, marker);
      });
    };
  });
//})();

function loadScript(src, callback) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  if (callback)
    script.onload = callback;
  document.getElementsByTagName("head")[0].appendChild(script);
  script.src = src;
}

(function($) {
  $(window).load(function() {
    /* Remove preloader */
    $(".preloader-wrapper").fadeOut(1000, function() {
      $(this).remove();
    });

    /* Navbar */
    var $logo = $(".navbar-brand img");
    $(document).on('affixed.bs.affix', ".navbar", function() {
      $logo.attr("src", $logo.data("logo"));
    });
    $(document).on('affixed-top.bs.affix', ".navbar", function() {
      $logo.attr("src", $logo.data("logo-white"));
    });
    if ($('.navbar').hasClass('affix')) {
      $logo.attr("src", $logo.data("logo"));
    }

    /* page scroll */
    var offset = $("body").data("offset");
    $(document).on('click', 'a.page-scroll', function(event) {
      var $anchor = $(this);
      $('html, body').stop().animate({
        scrollTop: $($anchor.attr('href')).offset().top - (offset - 1)
      }, 500, 'linear');
      event.preventDefault();
    });

   /* Youtube video play */
    $(document).on("click", ".videoPoster", function() {
      $(this).hide();
      var $iframe = $(this).parent().find(".embed-responsive-item");
      $iframe.attr("src", $iframe.data("src")).removeClass("hide");
    });

    /* Feature icon inside phone frame */
    $(document).on("mouseover", ".grid-icon-item", function() {
      $(".feature-image i").attr("class", $("i", this).attr("class"));
    });
  });
})(jQuery);
