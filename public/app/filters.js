(function() {
    var app = angular.module("ChatApp");

    app.filter("notUser", function () {
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

})();
