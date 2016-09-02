(function() {
    var app = angular.module("ChatApp");
    app.controller("ConversationListController", ["$scope", "$rootScope", "chatService",
    function($scope, $rootScope, chatService) {

        function getConversations() {
            return chatService.getConversations()
                .then(function(conversations) {
                    $scope.conversations = conversations;
                    $scope.conversations.forEach(function(conversation) {
                        conversation.lastModified = conversation.messages[conversation.messages.length - 1]
                            .timestamp;
                        if (conversation.lastModified > chatService.lastRead[conversation.id]) {
                            conversation.newMessages = true;
                        }
                    });
                });
        }

        getConversations().then(function() {
            $scope.conversations.forEach(function(conversation) {
                //first load just assume everything read
                chatService.lastRead[conversation.id] = conversation.lastModified;
            });
        });

        $scope.setActiveConversation = function(conversationId) {
            chatService.activeConversationId = conversationId;
            $rootScope.$emit("activeConversationChange", conversationId);
            getConversations();
        };

        var id = setInterval(function () {
            getConversations();
        }, 2000);

    }]);
})();
