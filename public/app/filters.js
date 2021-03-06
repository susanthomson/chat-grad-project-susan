(function() {
    var app = angular.module("ChatApp");

    app.filter("notCurrentUser", function () {
        return function (participants, userId) {
            return participants.filter(function(participant) {
                return participant !== userId;
            });
        };
    });

    app.filter("screenName", ["chatService", function(chatService) {
        return function(userId) {
            return chatService.screenName(userId);
        };
    }]);

    app.filter("avatar", ["chatService", function(chatService) {
        return function(userId) {
            return chatService.avatar(userId);
        };
    }]);

})();
