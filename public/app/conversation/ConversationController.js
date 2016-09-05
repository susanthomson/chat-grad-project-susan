(function() {
    var app = angular.module("ChatApp");
    app.controller("ConversationController", ["$scope", "$rootScope", "chatService",
    function($scope, $rootScope, chatService) {

        $rootScope.$on("activeConversationChange", updateConversation);
        $scope.conversationWindow = {};

        function updateConversation() {
            if (chatService.activeConversationId) {
                chatService.getConversation(chatService.activeConversationId).then(
                    function (conversation) {
                        $scope.activeConversation = conversation;
                        chatService.lastRead[conversation.id] = conversation.messages[conversation.messages.length - 1]
                            .timestamp;
                    }
                );
            }
        }

        $scope.sendMessage = function() {
            chatService.sendMessage($scope.activeConversation.id, $scope.conversationWindow.messageText)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.messageText = "";
                });
        };

        $scope.changeGroupName = function() {
            chatService.changeGroupName($scope.activeConversation.id, $scope.conversationWindow.newGroupName)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.newGroupName = "";
                    $scope.conversationWindow.changingName = false;
                });
        };

        $scope.clearMessages = function() {
            chatService.clearMessages($scope.activeConversation.id)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.changingName = false;
                });
        };

        $scope.addParticipant = function() {
            chatService.addParticipants($scope.activeConversation.id, [$scope.conversationWindow.newParticipant])
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.newParticipant = "";
                    $scope.conversationWindow.add = false;
                });
        };

        $scope.leave = function() {
            chatService.leave($scope.activeConversation.id)
                .then(function () {
                    updateConversation();
                });
        };

        var id = setInterval(updateConversation, 1000);

    }]);
})();
