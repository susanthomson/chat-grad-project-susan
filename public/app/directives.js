(function() {
    var app = angular.module("ChatApp");

    app.directive("chatAppConversation", function() {
        return {
            scope: {
                user: "="
            },
            templateUrl: "app/conversation/conversation.html",
            replace: true,
            controller: "ConversationController"
        };
    });

    app.directive("chatAppConversationList", function() {
        return {
            scope: {
                user: "="
            },
            templateUrl: "app/conversationList/conversationList.html",
            replace: true,
            controller: "ConversationListController"
        };
    });

    app.directive("chatAppUserList", function() {
        return {
            scope: {
                user: "="
            },
            templateUrl: "app/userList/userList.html",
            replace: true,
            controller: "UserListController"
        };
    });

})();
