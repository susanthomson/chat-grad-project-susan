(function() {
    var app = angular.module("ChatApp");
    app.service("chatService", ["$http", function ($http) {

        var self = this;
        self.activeConversationId = undefined;
        self.lastRead = {};

        self.startConversation = function(participants, groupName) {
            var body = {
                participants: participants,
            };
            if (groupName) {
                body.groupName = groupName;
            }
            return $http.post("/api/conversations", body, {
                headers: {"Content-type": "application/json"}
            }).then(function(result) {
                return result.data;
            });
        };

        self.getUsers = function () {
            return $http.get("/api/users")
                .then(function(result) {
                    return result.data;
                }).then(function (users) {
                    self.users = users;
                    return self.users;
                });
        };

        self.getUsers();
        self.screenName  = function(userId) {
            return self.users.find(function(user) {
                return user.id === userId;
            }).name;
        };

        self.avatar  = function(userId) {
            return self.users.find(function(user) {
                return user.id === userId;
            }).avatarUrl;
        };

        self.getConversations = function() {
            return $http.get("/api/conversations")
                .then(function(result) {
                    return result.data;
                });
        };

        self.getConversation = function(conversationId) {
            return $http.get("/api/conversations/" + conversationId)
                .then(function(result) {
                    return result.data;
                });
        };

        self.getConversationWith = function(participantId) {
            return $http.get("/api/conversations/?participant=" + participantId)
                .then(function(result) {
                    return result.data;
                }).catch(function (err) {
                    return self.startConversation([participantId]);
                });

        };

        self.sendMessage = function(conversationId, messageText) {
            var body = {
                message: messageText
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        self.changeGroupName = function(conversationId, groupName) {
            var body = {
                groupName: groupName
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        self.clearMessages = function(conversationId) {
            var body = {
                messages: []
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        self.addParticipants = function(conversationId, participants) {
            var body = {
                participants: participants
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

        self.leave = function(conversationId) {
            var body = {
                participants: "leave"
            };
            return $http.put("/api/conversations/" + conversationId, body, {
                headers: {"Content-type": "application/json"}
            });
        };

    }]);
})();
