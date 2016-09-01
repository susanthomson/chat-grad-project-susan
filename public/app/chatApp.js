/*global require:false */
(function() {
    var app = angular.module("ChatApp", []);

    require("./chatService.js");
    require("./directives.js");
    require("./filters.js");
    require("./ChatController.js");
    require("./conversation/ConversationController.js");
    require("./userList/UserListController.js");
    require("./conversationList/ConversationListController.js");

})();
