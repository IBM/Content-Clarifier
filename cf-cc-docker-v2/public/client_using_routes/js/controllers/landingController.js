webapp.controller('landingCtrl', function($scope, $timeout, $http, $compile, $location) {

    $scope.name     = "Content Clarifier";
    $scope.version  = "v1.5.0";
    $scope.release  = "07/12/2016";
    $scope.message  = "This app serves as a demo for the Content Clarifier API, a Cognitive Computing effort to perform content summarization and simplification. (Release " + $scope.version.trim() + ", " 	+ $scope.release.trim() + ")"; 

    /* *********** MODAL POPUP ************* */
    $scope.getModal = function(){
    	angular.element('[data-remodal-id=modal6]').remodal({ hashTracking: false }).open();
    }
   
    /* *********** LOGIN REDIRECT ************* */
    $scope.loginRedirect = function(){
           
    	//if(location.hostname == 'localhost'){
    	if($location.port() == 3000){ 
       		console.log("Port in landingController.js = " + $location.port());
        	$location.path('/index');
    	}else{
        	location.href = "https://contentclarifier.mybluemix.net/demo";
    	}
    }
     
    /* *********** VIDEO REDIRECT ************* */
     $scope.videoRedirect = function(){
      	location.href = "https://www.youtube.com/watch?v=0XkriBN5T4E";
     }
   
});
