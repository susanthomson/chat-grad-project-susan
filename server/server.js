var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var ObjectId = require("mongodb").ObjectID;

module.exports = function(port, db, githubAuthoriser) {
    var app = express();

    app.use(express.static("public"));
    app.use(cookieParser());
    app.use(bodyParser.json());

    var users = db.collection("users");
    var conversations = db.collection("conversations");
    var sessions = {};

    app.get("/oauth", function(req, res) {
        githubAuthoriser.authorise(req, function(githubUser, token) {
            if (githubUser) {
                users.findOne({
                    _id: githubUser.login
                }, function(err, user) {
                    if (!user) {
                        // TODO: Wait for this operation to complete
                        users.insertOne({
                            _id: githubUser.login,
                            name: githubUser.name,
                            avatarUrl: githubUser.avatar_url
                        });
                    }
                    sessions[token] = {
                        user: githubUser.login
                    };
                    res.cookie("sessionToken", token);
                    res.header("Location", "/");
                    res.sendStatus(302);
                });
            }
            else {
                res.sendStatus(400);
            }

        });
    });

    app.get("/api/oauth/uri", function(req, res) {
        res.json({
            uri: githubAuthoriser.oAuthUri
        });
    });

    app.use(function(req, res, next) {
        if (req.cookies.sessionToken) {
            req.session = sessions[req.cookies.sessionToken];
            if (req.session) {
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.get("/api/user", function(req, res) {
        users.findOne({
            _id: req.session.user
        }, function(err, user) {
            if (!err) {
                res.json(user);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/users", function(req, res) {
        users.find().toArray(function(err, docs) {
            if (!err) {
                res.json(docs.map(function(user) {
                    return {
                        id: user._id,
                        name: user.name,
                        avatarUrl: user.avatarUrl
                    };
                }));
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/users/:id", function(req, res) {
        users.findOne({
            _id: req.params.id
        }, function(err, user) {
            if (!err) {
                res.json(user);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/conversations", function(req, res) {
        var query = {};
        if (req.query.participant) {
            query = {
                participants: req.query.participant
            };
        }
        conversations.find(query).toArray(function(err, docs) {
            if (!err) {
                res.json(docs.map(function(conversation) {
                    return {
                        id: conversation._id,
                        participants: conversation.participants,
                        topic: conversation.topic,
                        messages: conversation.messages
                    };
                }));
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/conversations/:id", function(req, res) {
        conversations.findOne({
            _id: ObjectId(req.params.id)
        }, function(err, conversation) {
            if (!err) {
                res.json(conversation);
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.post("/api/conversations", function(req, res) {
        conversations.findOne({
            participants: req.body.participants
        },
            function(err, doc) {
                if (!err) {
                    if (!doc) {
                        conversations.insertOne({
                            participants: req.body.participants,
                            topic: req.body.topic,
                            messages: req.body.messages
                        });
                        res.sendStatus(201);
                    } else {
                        res.sendStatus(200);
                    }
                } else {
                    res.sendStatus(500);
                }
            });
    });

    app.put("/api/conversations/:id", function(req, res) {
        conversations.findAndModify(
            {
                _id: ObjectId(req.params.id)
            },
            [],
            {
                $push: {
                    messages: {
                        sender: req.body.userId, message: req.body.message
                    }
                }
            },
            function(err, docs) {
                if (!err) {
                    res.json(docs);
                } else {
                    res.sendStatus(500);
                }
            }
        );
    });

    return app.listen(port);
};
