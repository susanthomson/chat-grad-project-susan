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

        $scope.sendMessage = function(conversationId, messageText) {
            chatService.sendMessage(conversationId, messageText)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.messageText = "";
                });
        };

        $scope.changeTopic = function(conversationId, topicText) {
            chatService.changeTopic(conversationId, topicText)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.topicText = "";
                    $scope.conversationWindow.showTopicChange = false;
                });
        };

        $scope.clearMessages = function(conversationId) {
            chatService.clearMessages(conversationId)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.showTopicChange = false;
                });
        };

        $scope.addParticipant = function(conversationId) {
            chatService.addParticipants(conversationId, [$scope.conversationWindow.newParticipant])
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.newParticipant = "";
                    $scope.conversationWindow.add = false;
                });
        };

        $scope.leave = function(conversationId) {
            chatService.leave(conversationId)
                .then(function () {
                    updateConversation();
                });
        };

        var id = setInterval(updateConversation, 1000);

    }]);
})();
