/*global require:false */
(function() {
    var app = angular.module("ChatApp", ["ngMaterial", "ngMdIcons"])
    .config(function($mdThemingProvider) {

        $mdThemingProvider.registerStyles(require("./chatApp.scss"));
        $mdThemingProvider.theme("docs-dark", "default")
        .dark();
    });

    require("./chatService.js");
    require("./directives.js");
    require("./filters.js");
    require("./ChatController.js");
    require("./conversation/ConversationController.js");
    require("./userList/UserListController.js");
    require("./speechBubble/speechBubbleController.js");
    require("./conversationList/ConversationListController.js");

})();
