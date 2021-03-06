(function() {
    var app = angular.module("ChatApp");
    app.controller("ConversationController", ["$scope", "$rootScope", "chatService",
    function($scope, $rootScope, chatService, $mdColors) {

        $rootScope.$on("activeConversationChange", updateConversation);
        $scope.conversationWindow = {};
        $scope.newParticipants = [];

        var messageBox = document.getElementById("message-box");
        messageBox.onscroll = function() {
            clearInterval(scrolling);
            if (messageBox.scrollHeight - messageBox.scrollTop === messageBox.clientHeight) {
                scrolling = setInterval(scrollToBottom, 500);
            }
        };

        function getUsers() {
            return chatService.getUsers()
                .then(function(users) {
                    $scope.users = users;
                });
        }

        getUsers();

        function scrollToBottom() {
            messageBox.scrollTop = messageBox.scrollHeight;
        }

        function updateConversation() {
            if (chatService.activeConversationId) {
                chatService.getConversation(chatService.activeConversationId).then(
                    function (conversation) {
                        $scope.activeConversation = conversation;
                        chatService.lastRead[conversation.id] = conversation.messages[conversation.messages.length - 1]
                            .timestamp;
                    }
                );
            } else {
                $scope.activeConversation = undefined;
            }
        }

        $scope.sendMessage = function() {
            chatService.sendMessage($scope.activeConversation.id, $scope.conversationWindow.messageText)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.messageText = "";
                });
        };

        $scope.changingName = function() {
            $scope.conversationWindow.newGroupName = $scope.activeConversation.groupName;
            $scope.conversationWindow.changingName = true;
        };

        $scope.stopChangingName = function() {
            $scope.conversationWindow.changingName = false;
        };

        $scope.changeGroupName = function() {
            chatService.changeGroupName($scope.activeConversation.id, $scope.conversationWindow.newGroupName)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.changingName = false;
                });
        };

        $scope.clearMessages = function() {
            chatService.clearMessages($scope.activeConversation.id)
                .then(function () {
                    updateConversation();
                });
        };

        $scope.addParticipant = function() {
            $scope.users.forEach(function(user) {
                if (user.selected) {
                    $scope.newParticipants.push(user.id);
                }
            });
            chatService.addParticipants($scope.activeConversation.id, $scope.newParticipants)
                .then(function () {
                    updateConversation();
                    $scope.conversationWindow.add = false;
                });
        };

        $scope.inConversation = function(userId) {
            if ($scope.activeConversation.participants.indexOf(userId) >= 0) {
                return true;
            } else {
                return false;
            }
        };

        $scope.leave = function() {
            chatService.leave($scope.activeConversation.id)
                .then(function () {
                    chatService.activeConversationId = undefined;
                    $rootScope.$emit("activeConversationChange", undefined);
                    updateConversation();
                });
        };

        var id = setInterval(updateConversation, 1000);
        var scrolling = setInterval(scrollToBottom, 500);

    }]);
})();
