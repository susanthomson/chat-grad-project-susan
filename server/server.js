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
        var query = {
            participants: req.session.user
        };
        var expectingOne = false;
        if (req.query.participant) {
            expectingOne = true;
            query = {
                participants: {
                    $all: [req.query.participant , req.session.user]
                }
            };
        }
        conversations.find(query).toArray(function(err, docs) {
            if (!err) {
                if (docs.length === 0) {
                    res.sendStatus(404);
                } else if (expectingOne && docs.length === 1) {
                    var conversation = docs[0];
                    res.json({
                        id: conversation._id,
                        participants: conversation.participants,
                        topic: conversation.topic,
                        messages: conversation.messages
                    });
                } else {
                    res.json(docs.map(function(conversation) {
                        return {
                            id: conversation._id,
                            participants: conversation.participants,
                            topic: conversation.topic,
                            messages: conversation.messages
                        };
                    }));
                }
                //expecting one but got > 1?
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
                res.json({
                    id: conversation._id,
                    participants: conversation.participants,
                    topic: conversation.topic,
                    messages: conversation.messages
                });
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.post("/api/conversations", function(req, res) {
        var participants = req.body.participants;
        participants.push(req.session.user);
        participants.sort();
        conversations.findOne({
            participants: participants
        },
            function(err, doc) {
                if (!err) {
                    if (!doc) {
                        conversations.insertOne({
                            participants: participants,
                            topic: req.body.topic,
                            messages: [{
                                sender: req.session.user,
                                message: "started conversation",
                                system: true,
                                timestamp: Date.now()
                            }]
                        }, function(err, doc) {
                            res.status(201).json({
                                id: doc.insertedId
                            });
                        });
                    } else {
                        res.sendStatus(200);
                    }
                } else {
                    res.sendStatus(500);
                }
            });
    });

    app.put("/api/conversations/:id", function(req, res) {
        var update = {};
        if (req.body.message) {
            update = {
                $push: {
                    messages: {
                        sender: req.session.user,
                        message: req.body.message,
                        timestamp: Date.now()
                    }
                }
            };
        }
        if (req.body.topic) {
            update = {
                $set: {
                    topic: req.body.topic
                },
                $push: {
                    messages: {
                        sender: req.session.user,
                        message: "changed topic to " + req.body.topic,
                        system: true,
                        timestamp: Date.now()
                    }
                }
            };
        }
        if (req.body.messages) {
            update = {
                $set: {
                    messages: [{
                        sender: req.session.user,
                        message: "cleared conversation",
                        system: true,
                        timestamp: Date.now()
                    }]
                }
            };
        }
        conversations.findAndModify(
            {
                _id: ObjectId(req.params.id)
            },
            [],
            update,
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
