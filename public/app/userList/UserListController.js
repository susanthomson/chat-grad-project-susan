(function() {
    var app = angular.module("ChatApp");
    app.controller("UserListController", ["$scope", "$rootScope", "chatService",
    function($scope, $rootScope, chatService) {

        function getUsers() {
            return chatService.getUsers()
                .then(function(users) {
                    $scope.users = users;
                });
        }

        getUsers();

        $scope.chat = function(participantId) {
            chatService.getConversationWith(participantId)
                .then(function (conversation) {
                    chatService.activeConversationId = conversation.id;
                    $rootScope.$emit("activeConversationChange", conversation.id);
                });
        };

        $scope.groupChat = function() {
            chatService.startConversation([], "new group")
                .then(function (conversation) {
                    chatService.activeConversationId = conversation.id;
                    $rootScope.$emit("activeConversationChange", conversation.id);
                });
        };

        $scope.addToChat = function(participantId) {
            if (chatService.activeConversationId) {
                chatService.addParticipants(chatService.activeConversationId, [participantId]);
            }
        };

        $scope.canBeAdded = function(participantId) {
            var inConversation = false;
            if ($scope.activeConversation) {
                if ($scope.activeConversation.groupName) {
                    if ($scope.activeConversation.participants.indexOf(participantId) < 0) {
                        inConversation = true;
                    }
                }
            }
            if (participantId === $scope.user._id) {
                inConversation = false;
            }
            return inConversation;
        };

    }]);
})();
