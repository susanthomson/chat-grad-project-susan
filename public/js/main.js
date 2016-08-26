(function() {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", ["$scope", "$http", "chatService", function($scope, $http, chatService) {
        $scope.loggedIn = false;

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;
            $http.get("/api/users").then(function(result) {
                $scope.users = result.data;
            });

            function getConversations() {
                chatService.getConversations($scope.user._id)
                    .then(function (conversations) {
                        $scope.conversations = conversations;
                        $scope.conversations.forEach(function(conversation) {
                            conversation.lastModified = conversation.messages[conversation.messages.length - 1]
                                .timestamp;
                        });
                    });
            }

            getConversations();

            $scope.conversationWindow = {
                activeConversationId: undefined
            };

            $scope.setActiveConversation = function(id) {
                chatService.getConversation(id).then(
                    function (conversation) {
                        $scope.activeConversation = conversation;
                        $scope.conversationWindow.activeConversationId = $scope.activeConversation.id;
                    }
                );
            };

            $scope.notYou  = function(participants) {
                return chatService.notYou($scope.user._id, participants);
            };

            $scope.conversationExists = function(participants) {
                return $scope.conversations.reduce(function(prev, conversation) {
                    if (conversation.participants[0] === participants[0] &&
                        conversation.participants[1] === participants[1]) {
                        return conversation.id;
                    }
                    return prev;
                }, undefined);
            };

            $scope.startConversation = function(participantId) {
                //if convo doesn't exist
                var exists = $scope.conversationExists([$scope.user._id, participantId].sort());
                if (exists) {
                    $scope.setActiveConversation(exists);
                } else {
                    chatService.startConversation($scope.user._id, participantId, "stuff")
                        .then(function (res) {
                            getConversations();
                            $scope.setActiveConversation(res.id);
                        });
                }
            };

            var id = setInterval(function () {
                getConversations();
            }, 2000);

        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });
    }]);
})();
