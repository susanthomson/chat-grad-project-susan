(function() {
    var app = angular.module("ChatApp");
    app.service("chatService", ["$http", function ($http) {

        var self = this;
        this.activeConversationId = undefined;
        this.lastRead = {};

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

        this.getUsers = function () {
            return $http.get("/api/users")
                .then(function(result) {
                    return result.data;
                }).then(function (users) {
                    self.users = users;
                    return self.users;
                });
        };

        self.getUsers();
        this.screenName  = function(userId) {
            return self.users.find(function(user) {
                return user.id === userId;
            }).name;
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

        this.getConversationWith = function(userId, participantId) {
            return $http.get("/api/conversations/?participant=" + userId + "&secondParticipant=" + participantId)
                .then(function(result) {
                    return result.data;
                }).catch(function (err) {
                    return self.startConversation(userId, participantId, "new conversation");
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

    }]);
})();
