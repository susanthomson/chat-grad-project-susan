(function() {
    var app = angular.module("ChatApp");
    app.controller("ConversationListController", ["$scope", "$rootScope", "chatService", "notUserFilter",
    function($scope, $rootScope, chatService, notUserFilter) {

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
                        conversation.name = getName(conversation);
                        conversation.avatarUrl = getAvatarUrl(conversation);
                    });
                });
        }

        function getName(conversation) {
            if (conversation.groupName) {
                return conversation.groupName;
            } else {
               var userName = notUserFilter(conversation.participants, $scope.user._id)[0];
               return chatService.screenName(userName);
            }
        }
        
        function getAvatarUrl(conversation) {
            if (conversation.groupName) {
                return "https://upload.wikimedia.org/wikipedia/commons/3/34/Red-crested_Turaco_RWD.jpg";
            } else {
               var userName = notUserFilter(conversation.participants, $scope.user._id)[0];
               return chatService.avatar(userName);
            }
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
