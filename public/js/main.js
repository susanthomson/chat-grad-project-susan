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
                    });
            }

            getConversations();

            $scope.notYou  = function(participants) {
                return participants.filter(function(participant) {
                    return participant !== $scope.user._id;
                });
            };

            $scope.startConversation = function(participantId) {
                chatService.startConversation($scope.user._id, participantId, "stuff")
                    .then(getConversations);
            };

            $scope.sendMessage = function(conversationId, messageText) {
                chatService.sendMessage($scope.user._id, conversationId, messageText)
                    .then(getConversations);
            };

            var id = setInterval(getConversations, 10000);

        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });
    }]);

    app.service("chatService", ["$http", function ($http) {

        this.startConversation = function(userId, partnerID, topic) {
            var participants = [userId, partnerID].sort();
            var body = {
                participants: participants,
                topic: topic,
                messages: []
            };
            return $http.post("/api/conversations", body, {
                headers: {"Content-type": "application/json"}
            });
        };

        this.getConversations = function(userId) {
            return $http.get("/api/conversations?participant=" + userId)
                .then(function(result) {
                    return result.data;
                });
        };

        this.getConversation = function(conversationId) {
            return $http.get("/api/conversations/" + conversationId)
                .then(function(result) {
                    return result.data;
                });
        };

        this.sendMessage = function(userId, conversationId, messageText) {
            var body = {
                userId: userId,
                message: messageText
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

    }]);
})();
