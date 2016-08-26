(function() {
    var app = angular.module("ChatApp");
    app.controller("ConversationController", ["$scope", "chatService", function($scope, chatService) {

        $scope.sendMessage = function(conversationId, messageText) {
            chatService.sendMessage($scope.user._id, conversationId, messageText)
                .then(function () {
                    $scope.setActiveConversation(conversationId);
                    $scope.conversationWindow.messageText = "";
                });
        };

        $scope.changeTopic = function(conversationId, topicText) {
            chatService.changeTopic($scope.user._id, conversationId, topicText)
                .then(function () {
                    $scope.setActiveConversation(conversationId);
                    $scope.conversationWindow.topicText = "";
                    $scope.showTopicChange = false;
                });
        };

        $scope.clearMessages = function(conversationId) {
            chatService.clearMessages($scope.user._id, conversationId)
                .then(function () {
                    $scope.setActiveConversation(conversationId);
                    $scope.showTopicChange = false;
                });
        };

        var id = setInterval(function () {
            $scope.setActiveConversation($scope.activeConversation.id);
        }, 2000);

    }]);
})();
