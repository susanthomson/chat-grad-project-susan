(function() {
    var app = angular.module("ChatApp");
    app.controller("SpeechBubbleController", ["$scope",
    function($scope, $mdColors) {
        if ($scope.bubble === "right") {
            $scope.colour = "primary-hue-1";
        } else if ($scope.bubble === "left") {
            $scope.colour = "background-hue-3";
        } else {
            $scope.colour = "warn-500";
        }
    }]);
})();
