

//Define an angular module for our app
var webapp =angular.module(['myApp'], [ 'uiSwitch','ngSanitize', 'ngRoute',  'ckeditor', '720kb.tooltips', 'slickCarousel']);

/*

webapp.directive('scrollOnClick', function() {
  return {
    restrict: 'A',
    link: function(scope, $elm, attrs) {
      var idToScroll = attrs.href;
      $elm.on('click', function() {
        var $target;
        if (idToScroll) {
          $target = $(idToScroll);
        } else {
          $target = $elm;
        }
        $("body").animate({scrollTop: $target.offset().top}, "slow");
      });
    }
  }
});

*/
webapp.directive('tooltip', function() {
    return {
        restrict: 'A',
        controller: function($scope, $element) {
            $scope.isShown = false;
            this.showHover = function() {
                $scope.isShown = $scope.isShown == true ? false : true;
            }
        },
        transclude: true,
        template: '<div ng-transclude></div>' +
            '<div id="divPopup" ng-show="isShown">' +
            '<div class="floatLeft">' +
            '<img src="images/tooltipArrow.png" />' +
            '</div>' +
            '<div class="floatLeft margin3">' +
            '<span>' +
            'I am the Hover Popup' +
            '</span>' +
            '</div>' +
            '</div>'
    }
})
webapp.directive('dynamic', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.dynamic, function(html) {
        ele.html(html);
        $compile(ele.contents())(scope);
      });
    }
  };
});

// Configure web app
webapp.config(function ($provide, $httpProvider, $routeProvider) {
    
    
     $routeProvider
    /* . when('/index', { 
		templateUrl: './public/content.html',
		controller: 'myCtrl' 
	}) */

     . when('/homepage', { 
		templateUrl: './public/Homepage.html',
		controller: 'initAashuAppPage' 
	}) 

        . when('/app', { 
		templateUrl: './public/Editor.html',
		controller: 'editorCtrl' 
	}) 

     . when('/indexCK', { 
		templateUrl: './public/indexCK.html',
		controller: 'editorCtrl' 
	}) 
     . when('/landing', { 
		templateUrl: './public/landing.html',
		controller: 'landingCtrl' 
	})
     . when('', { 
		redirectTo: '/homepage' 
	})
     . otherwise ({ 
		redirectTo: '/homepage' 
	});

     
   

      $provide.factory('ErrorInterceptor', function ($q) {
        return {
            responseError: function(rejection) {
                console.log("EXCEPTION (from server) detected in webapp!");
                console.log(rejection);
                return $q.reject(rejection);
                }
             };
       });

       $httpProvider.interceptors.push('ErrorInterceptor');
	}).run( function($rootScope, $location, $http, $anchorScroll) {
           

		/*
  		//when the route is changed scroll to the proper element.
  		$rootScope.$on('$routeChangeSuccess', function(newRoute, oldRoute) {
    			if($location.hash()) $anchorScroll();  
  		});
		
                */
    
  		$rootScope.$on('$routeChangeStart', function (event) {
 		// alert( $location.host());
      			//if($location.host() != 'localhost'){
                        if($location.port() != 3000){ 
                                console.log("Port in app.js = " + $location.port() );
          			$http.get('/confirm-login').success(function (isLoggedIn) {
                    			if(isLoggedIn == "true"){
                        			$location.path('/index');
                    			}
                    			else{
                         			$location.path('/landing');               
                    			}
            			}); 
        		 }
   	});

	

    
}); 

	

/*
webapp.run(function($rootScope, $location, $anchorScroll, $routeParams) {
  //when the route is changed scroll to the proper element.
  $rootScope.$on('$routeChangeSuccess', function(newRoute, oldRoute) {
		//alert("Reached here");
	   // $location.hash($routeParams.scrollTo);
	   // $anchorScroll();
	     $timeout(function() {
                $location.hash(newRoute);
                $anchorScroll();
            });  
  });
});

*/


// Configure routes by uncommenting the below.
// http://tutorials.jenkov.com/angularjs/routes.html
/* To use, must:
- add angular-route as a package dependency
- include angular-route.js in target html page
- configure the routes as shown below
- put <div ng-view></div> in the target html page where you want the content "frame" displayed
- to browse to the route  http://<hostname>:<port>/#route

app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/route1', {
                templateUrl: 'routes/route1.html',
                controller: 'myCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });
    }]);
    
    */
