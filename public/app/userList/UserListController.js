(function() {
    var app = angular.module("ChatApp");
    app.controller("UserListController", ["$scope", "$rootScope", "chatService",
    function($scope, $rootScope, chatService) {

        $scope.ctrl = {
            adding: false
        };
        $scope.participants = [];

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
            chatService.startConversation($scope.participants, $scope.ctrl.groupName)
                .then(function (conversation) {
                    chatService.activeConversationId = conversation.id;
                    $rootScope.$emit("activeConversationChange", conversation.id);
                    $scope.ctrl.groupName = "";
                    $scope.ctrl.adding = false;
                });
        };

        $scope.addToChat = function(participantId) {
            $scope.participants.push(participantId);
        };

    }]);
})();
