(function() {
    var app = angular.module("ChatApp");
    app.service("chatService", ["$http", function ($http) {

        this.startConversation = function(userId, partnerID, topic) {
            var participants = [userId, partnerID].sort();
            var body = {
                userId: userId,
                participants: participants,
                topic: topic,
            };
            return $http.post("/api/conversations", body, {
                headers: {"Content-type": "application/json"}
            }).then(function(result) {
                return result.data;
            });
        };

        this.getConversations = function(userId) {
            return $http.get("/api/conversations?participant=" + userId)
                .then(function(result) {
                    return result.data;
                });
        };

        this.getConversation = function(conversationId) {
            return $http.get("/api/conversations/" + conversationId)
                .then(function(result) {
                    return result.data;
                });
        };

        this.sendMessage = function(userId, conversationId, messageText) {
            var body = {
                userId: userId,
                message: messageText
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        this.changeTopic = function(userId, conversationId, topic) {
            var body = {
                topic: topic,
                userId: userId,
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        this.clearMessages = function(userId, conversationId) {
            var body = {
                userId: userId,
                messages: []
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        this.notYou  = function(userId, participants) {
            return participants.filter(function(participant) {
                return participant !== userId;
            });
        };

    }]);
})();
