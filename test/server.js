var server = require("../server/server");
var request = require("request");
var assert = require("chai").assert;
var sinon = require("sinon");

var testPort = 52684;
var baseUrl = "http://localhost:" + testPort;
var oauthClientId = "1234clientId";

var testUser = {
    _id: "bob",
    name: "Bob Bilson",
    avatarUrl: "http://avatar.url.com/u=test"
};
var testUser2 = {
    _id: "charlie",
    name: "Charlie Colinson",
    avatarUrl: "http://avatar.url.com/u=charlie_colinson"
};
var testGithubUser = {
    login: "bob",
    name: "Bob Bilson",
    avatar_url: "http://avatar.url.com/u=test"
};

var testConversation = {
    "_id": {
        "$oid": "57bc4c711aee92c01976585a"
    },
    "participants": [
        "bob",
        "charlie"
    ],
    "topic": "fun stuff",
    "messages": [
        {
            "sender": "bob",
            "message": "hi"
        }
    ]
};
var testConversation2 = {
    "_id": {
        "$oid": "57bd5e3ff46b866009257c99"
    },
    "participants": [
        "bob",
        "james"
    ],
    "topic": "other stuff",
    "messages": [
        {
            "sender": "bob",
            "message": "yo"
        }
    ]
};

var testToken = "123123";
var testExpiredToken = "987978";

describe("server", function() {
    var cookieJar;
    var db;
    var githubAuthoriser;
    var serverInstance;
    var dbCollections;
    beforeEach(function() {
        cookieJar = request.jar();
        dbCollections = {
            users: {
                find: sinon.stub(),
                findOne: sinon.stub(),
                insertOne: sinon.spy()
            },
            conversations: {
                find: sinon.stub(),
                findOne: sinon.stub(),
                findAndModify: sinon.stub(),
                insertOne: sinon.spy()
            }
        };
        db = {
            collection: sinon.stub()
        };
        db.collection.withArgs("users").returns(dbCollections.users);
        db.collection.withArgs("conversations").returns(dbCollections.conversations);

        githubAuthoriser = {
            authorise: function() {},
            oAuthUri: "https://github.com/login/oauth/authorize?client_id=" + oauthClientId
        };
        serverInstance = server(testPort, db, githubAuthoriser);
    });
    afterEach(function() {
        serverInstance.close();
    });
    function authenticateUser(user, token, callback) {
        sinon.stub(githubAuthoriser, "authorise", function(req, authCallback) {
            authCallback(user, token);
        });

        dbCollections.users.findOne.callsArgWith(1, null, user);

        request(baseUrl + "/oauth", function(error, response) {
            cookieJar.setCookie(request.cookie("sessionToken=" + token), baseUrl);
            callback();
        });
    }
    describe("GET /oauth", function() {
        var requestUrl = baseUrl + "/oauth";

        it("responds with status code 400 if oAuth authorise fails", function(done) {
            var stub = sinon.stub(githubAuthoriser, "authorise", function(req, callback) {
                callback(null);
            });

            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 400);
                done();
            });
        });
        it("responds with status code 302 if oAuth authorise succeeds", function(done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function(req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, user);

            request({url: requestUrl, followRedirect: false}, function(error, response) {
                assert.equal(response.statusCode, 302);
                done();
            });
        });
        it("responds with a redirect to '/' if oAuth authorise succeeds", function(done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function(req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, user);

            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 200);
                assert.equal(response.request.uri.path, "/");
                done();
            });
        });
        it("add user to database if oAuth authorise succeeds and user id not found", function(done) {
            var user = testGithubUser;
            var stub = sinon.stub(githubAuthoriser, "authorise", function(req, authCallback) {
                authCallback(user, testToken);
            });

            dbCollections.users.findOne.callsArgWith(1, null, null);

            request(requestUrl, function(error, response) {
                assert(dbCollections.users.insertOne.calledOnce);
                assert.deepEqual(dbCollections.users.insertOne.firstCall.args[0], {
                    _id: "bob",
                    name: "Bob Bilson",
                    avatarUrl: "http://avatar.url.com/u=test"
                });
                done();
            });
        });
    });
    describe("GET /api/oauth/uri", function() {
        var requestUrl = baseUrl + "/api/oauth/uri";
        it("responds with status code 200", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 200);
                done();
            });
        });
        it("responds with a body encoded as JSON in UTF-8", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
                done();
            });
        });
        it("responds with a body that is a JSON object containing a URI to GitHub with a client id", function(done) {
            request(requestUrl, function(error, response, body) {
                assert.deepEqual(JSON.parse(body), {
                    uri: "https://github.com/login/oauth/authorize?client_id=" + oauthClientId
                });
                done();
            });
        });
    });
    describe("GET /api/user", function() {
        var requestUrl = baseUrl + "/api/user";
        it("responds with status code 401 if user not authenticated", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the user if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                request({url: requestUrl, jar: cookieJar}, function(error, response, body) {
                    assert.deepEqual(JSON.parse(body), {
                        _id: "bob",
                        name: "Bob Bilson",
                        avatarUrl: "http://avatar.url.com/u=test"
                    });
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function(done) {
            authenticateUser(testUser, testToken, function() {

                dbCollections.users.findOne.callsArgWith(1, {err: "Database error"}, null);

                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/users", function() {
        var requestUrl = baseUrl + "/api/users";
        var allUsers;
        beforeEach(function() {
            allUsers = {
                toArray: sinon.stub()
            };
            dbCollections.users.find.returns(allUsers);
        });
        it("responds with status code 401 if user not authenticated", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                allUsers.toArray.callsArgWith(0, null, [testUser]);

                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the users if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                allUsers.toArray.callsArgWith(0, null, [
                        testUser,
                        testUser2
                    ]);

                request({url: requestUrl, jar: cookieJar}, function(error, response, body) {
                    assert.deepEqual(JSON.parse(body), [
                        {
                            id: "bob",
                            name: "Bob Bilson",
                            avatarUrl: "http://avatar.url.com/u=test"
                        },
                        {
                            id: "charlie",
                            name: "Charlie Colinson",
                            avatarUrl: "http://avatar.url.com/u=charlie_colinson"
                        }
                    ]);
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function(done) {
            authenticateUser(testUser, testToken, function() {
                allUsers.toArray.callsArgWith(0, {err: "Database failure"}, null);

                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/users/:id", function() {
        var userId = testUser2.name;
        var requestUrl = baseUrl + "/api/users/" + userId;
        it("responds with status code 401 if user not authenticated", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the user with id 'id' if user is authenticated",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.users.findOne.callsArgWith(1, null, testUser2);
                request({url: requestUrl, jar: cookieJar}, function(error, response, body) {
                    assert.deepEqual(JSON.parse(body), {
                        _id: "charlie",
                        name: "Charlie Colinson",
                        avatarUrl: "http://avatar.url.com/u=charlie_colinson"
                    });
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function(done) {
            authenticateUser(testUser, testToken, function() {

                dbCollections.users.findOne.callsArgWith(1, {err: "Database error"}, null);

                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/conversations/:id", function() {
        var conversationId = testConversation2._id.$oid;
        var requestUrl = baseUrl + "/api/conversations/" + conversationId;
        it("responds with status code 401 if user not authenticated", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findOne.callsArgWith(1, null, testConversation2);
                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the conversation" +
        " with id 'id' if user is authenticated",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findOne.callsArgWith(1, null, testConversation2);
                request({url: requestUrl, jar: cookieJar}, function(error, response, body) {
                    assert.deepEqual(JSON.parse(body), {
                        "_id": {
                            "$oid": "57bd5e3ff46b866009257c99"
                        },
                        "participants": [
                            "bob",
                            "james"
                        ],
                        "topic": "other stuff",
                        "messages": [
                            {
                                "sender": "bob",
                                "message": "yo"
                            }
                        ]
                    });
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function(done) {
            authenticateUser(testUser, testToken, function() {

                dbCollections.conversations.findOne.callsArgWith(1, {err: "Database error"}, null);

                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("GET /api/conversations", function() {
        var requestUrl = baseUrl + "/api/conversations";
        var allConversations;
        beforeEach(function() {
            allConversations = {
                toArray: sinon.stub()
            };
            dbCollections.conversations.find.returns(allConversations);
        });
        it("responds with status code 401 if user not authenticated", function(done) {
            request(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated", function(done) {
            authenticateUser(testUser, testToken, function() {
                allConversations.toArray.callsArgWith(0, null, [
                    testConversation,
                    testConversation2
                ]);
                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of the conversations if user is authenticated",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                allConversations.toArray.callsArgWith(0, null, [
                        testConversation,
                        testConversation2
                ]);

                request({url: requestUrl, jar: cookieJar}, function(error, response, body) {
                    assert.deepEqual(JSON.parse(body), [
                        {
                            "id": {
                                "$oid": "57bc4c711aee92c01976585a"
                            },
                            "participants": [
                                "bob",
                                "charlie"
                            ],
                            "topic": "fun stuff",
                            "messages": [
                                {
                                    "sender": "bob",
                                    "message": "hi"
                                }
                            ]
                        },
                        {
                            "id": {
                                "$oid": "57bd5e3ff46b866009257c99"
                            },
                            "participants": [
                                "bob",
                                "james"
                            ],
                            "topic": "other stuff",
                            "messages": [
                                {
                                    "sender": "bob",
                                    "message": "yo"
                                }
                            ]
                        }
                    ]);
                    done();
                });
            });
        });
        it("responds with a body that is a JSON representation of a conversation" +
        " if user is authenticated when called with query string ", function(done) {
            authenticateUser(testUser, testToken, function() {
                allConversations.toArray.callsArgWith(0, null, [
                        testConversation,
                        testConversation2
                ]);

                request({url: requestUrl + "?participant=bob", jar: cookieJar}, function(error, response, body) {
                    assert.deepEqual(JSON.parse(body), [
                        {
                            "id": {
                                "$oid": "57bc4c711aee92c01976585a"
                            },
                            "participants": [
                                "bob",
                                "charlie"
                            ],
                            "topic": "fun stuff",
                            "messages": [
                                {
                                    "sender": "bob",
                                    "message": "hi"
                                }
                            ]
                        },
                        {
                            "id": {
                                "$oid": "57bd5e3ff46b866009257c99"
                            },
                            "participants": [
                                "bob",
                                "james"
                            ],
                            "topic": "other stuff",
                            "messages": [
                                {
                                    "sender": "bob",
                                    "message": "yo"
                                }
                            ]
                        }
                    ]);
                    done();
                });
            });
        });
        it("responds with status code 500 if database error", function(done) {
            authenticateUser(testUser, testToken, function() {
                allConversations.toArray.callsArgWith(0, {err: "Database failure"}, null);

                request({url: requestUrl, jar: cookieJar}, function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("POST /api/conversations", function() {
        var requestUrl = baseUrl + "/api/conversations";
        it("responds with status code 401 if user not authenticated", function(done) {
            request.post(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request.post({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("adds conversation to database and responds with status code 201 " +
        "if user is authenticated and conversation doesn't already exist",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findOne.callsArgWith(1, null, undefined);
                request({method: "POST", url: requestUrl, jar: cookieJar,
                body: JSON.stringify({
                    participants: "participants",
                    topic: "topic",
                    messages: []
                }),
                headers: {"Content-type": "application/json"}},
                function(error, response) {
                    assert.equal(response.statusCode, 201);
                    assert(dbCollections.conversations.insertOne.calledOnce);
                    assert.deepEqual(dbCollections.conversations.insertOne.firstCall.args[0], {
                        participants: "participants",
                        topic: "topic",
                        messages: []
                    });
                    done();
                });
            });
        });
        it("does not add conversation to database and responds with status code 200 " +
        "if user is authenticated and conversation already exists",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findOne.callsArgWith(1, null, testConversation);
                request({method: "POST", url: requestUrl, jar: cookieJar,
                body: JSON.stringify({
                    participants: "participants",
                    topic: "topic",
                    messages: []
                }),
                headers: {"Content-type": "application/json"}},
                function(error, response) {
                    assert.equal(response.statusCode, 200);
                    assert(!dbCollections.conversations.insertOne.called);
                    done();
                });
            });
        });
        it("responds with status code 500 if user is authenticated and there was a database error",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findOne.callsArgWith(1, {err: "Database failure"}, null);
                request({method: "POST", url: requestUrl, jar: cookieJar,
                body: JSON.stringify({
                    participants: "participants",
                    topic: "topic",
                    messages: []
                }),
                headers: {"Content-type": "application/json"}},
                function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
    describe("PUT /api/conversations/:id", function() {
        var conversationId = "57bc4c711aee92c01976585a";
        var requestUrl = baseUrl + "/api/conversations/" + conversationId;
        it("responds with status code 401 if user not authenticated", function(done) {
            request.put(requestUrl, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 401 if user has an unrecognised session token", function(done) {
            cookieJar.setCookie(request.cookie("sessionToken=" + testExpiredToken), baseUrl);
            request.put({url: requestUrl, jar: cookieJar}, function(error, response) {
                assert.equal(response.statusCode, 401);
                done();
            });
        });
        it("responds with status code 200 if user is authenticated and conversation exists",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findAndModify.callsArgWith(3, null, testConversation);
                request({method: "PUT", url: requestUrl, jar: cookieJar,
                body: JSON.stringify({
                    participants: "participants",
                    topic: "topic",
                    messages: []
                }),
                headers: {"Content-type": "application/json"}},
                function(error, response) {
                    assert.equal(response.statusCode, 200);
                    done();
                });
            });
        });
        it("responds with status code 500 if user is authenticated and there was a database error",
        function(done) {
            authenticateUser(testUser, testToken, function() {
                dbCollections.conversations.findAndModify.callsArgWith(3, {err: "Database failure"}, null);
                request({method: "PUT", url: requestUrl, jar: cookieJar,
                body: JSON.stringify({
                    participants: "participants",
                    topic: "topic",
                    messages: []
                }),
                headers: {"Content-type": "application/json"}},
                function(error, response) {
                    assert.equal(response.statusCode, 500);
                    done();
                });
            });
        });
    });
});
