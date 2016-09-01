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
            chatService.sendMessage($scope.user._id, conversationId, messageText)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.messageText = "";
                });
        };

        $scope.changeTopic = function(conversationId, topicText) {
            chatService.changeTopic($scope.user._id, conversationId, topicText)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.topicText = "";
                    $scope.conversationWindow.showTopicChange = false;
                });
        };

        $scope.clearMessages = function(conversationId) {
            chatService.clearMessages($scope.user._id, conversationId)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.showTopicChange = false;
                });
        };

        var id = setInterval(updateConversation, 1000);

    }]);
})();
