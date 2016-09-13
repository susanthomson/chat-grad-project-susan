(function() {
    var app = angular.module("ChatApp");

    app.controller("ChatController", ["$scope", "$http", "chatService",
    function($scope, $http, chatService) {
        $scope.loggedIn = false;

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;

            $scope.updateConversation = function () {
                if (chatService.activeConversationId) {
                    chatService.getConversation(chatService.activeConversationId).then(
                        function (conversation) {
                            $scope.activeConversation = conversation;
                            chatService.lastRead[conversation.id] =
                                conversation.messages[conversation.messages.length - 1].timestamp;
                        }
                    );
                } else {
                    $scope.activeConversation = undefined;
                }
            };

            setInterval($scope.updateConversation, 3000);

        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });
    }]);

})();
