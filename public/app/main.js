(function() {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", ["$scope", "$http", "chatService",
    function($scope, $http, chatService) {
        $scope.loggedIn = false;

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;
        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });
    }]);

    app.filter("notUser", function () {
        return function (participants, userId) {
            return participants.filter(function(participant) {
                return participant !== userId;
            });
        };
    });
    app.filter("screenName", ["chatService", function(chatService) {
        return function(userId) {
            return chatService.screenName(userId);
        };
    }]);

})();
